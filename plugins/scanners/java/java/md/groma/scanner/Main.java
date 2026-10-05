package md.groma.scanner;

import com.sun.source.tree.CompilationUnitTree;
import com.sun.source.tree.Tree;
import com.sun.source.util.JavacTask;
import com.sun.source.util.TreeScanner;
import com.sun.source.util.Trees;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ConcurrentLinkedQueue;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.StandardLocation;
import javax.tools.ToolProvider;

/** Parse and attribute only. Never generate bytecode or run a repository build. */
public final class Main {
    private Main() {}
    private record Project(Path root, List<Path> files, String release, String encoding) {}

    /** A thread reuses library-file caches; each compiler task still has its own context and locations. */
    private static final class FileManagers implements AutoCloseable {
        private final ThreadLocal<Map<String, StandardJavaFileManager>> local = ThreadLocal.withInitial(HashMap::new);
        private final ConcurrentLinkedQueue<StandardJavaFileManager> opened = new ConcurrentLinkedQueue<>();

        StandardJavaFileManager forEncoding(String encoding) {
            return local.get().computeIfAbsent(encoding, key -> {
                var manager = ToolProvider.getSystemJavaCompiler().getStandardFileManager(
                    null, Locale.ROOT, java.nio.charset.Charset.forName(key));
                opened.add(manager);
                return manager;
            });
        }

        @Override public void close() throws java.io.IOException {
            for (var manager : opened) manager.close();
        }
    }

    public static void main(String[] args) {
        try {
            var input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
            if (args.length == 2 && args[0].equals("outline")) {
                var root = Path.of(args[1]).toRealPath();
                System.out.println(Json.encode(Outline.read(root, sourceFiles(root, input))));
                return;
            }
            if (args.length == 0 || args.length % 3 != 0) throw new IllegalArgumentException("Expected root, release and encoding per project");
            if (Runtime.version().feature() < 21) throw new IllegalArgumentException("JDK 21 or newer is required");
            var projects = new ArrayList<Project>();
            for (int project = 0; project < args.length; project += 3) {
                var root = Path.of(args[project]).toRealPath();
                var release = args[project + 1].isEmpty() ? Integer.toString(Runtime.version().feature()) : args[project + 1];
                var files = sourceFiles(root, input);
                if (files.isEmpty()) throw new IllegalArgumentException("No Java files supplied");
                projects.add(new Project(root, files, release, args[project + 2]));
            }
            // Start the largest tasks first so one late module does not leave the other workers idle.
            var ordered = new ArrayList<>(projects);
            ordered.sort(java.util.Comparator.comparingInt((Project project) -> -project.files().size()));
            // Bound concurrent compiler memory, keep task state private, and print in project order.
            try (var managers = new FileManagers();
                 var workers = Executors.newFixedThreadPool(Math.min(4, Runtime.getRuntime().availableProcessors()))) {
                var outputs = new IdentityHashMap<Project, Future<String>>();
                for (var project : ordered) {
                    outputs.put(project, workers.submit(() -> Json.encode(analyze(
                        project.root(), project.files(), project.release(), project.encoding(), managers.forEncoding(project.encoding())))));
                }
                for (var project : projects) System.out.println(outputs.get(project).get());
            }
        } catch (Exception error) {
            System.err.println("JAVA_SCAN_FAILED: " + error.getMessage());
            System.exit(2);
        }
    }

    /** One project-relative source path per line; a blank line separates compiler tasks. */
    private static List<Path> sourceFiles(Path root, BufferedReader input) {
        return input.lines().takeWhile(line -> !line.isEmpty()).map(root::resolve).toList();
    }

    private static Object analyze(Path root, List<Path> files, String release, String encoding, StandardJavaFileManager manager) throws Exception {
        var compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IllegalStateException("Runtime has no jdk.compiler module; a JRE is insufficient");
        var diagnostics = new DiagnosticCollector<JavaFileObject>();
        manager.setLocationFromPaths(StandardLocation.CLASS_PATH, List.of());
        manager.setLocationFromPaths(StandardLocation.SOURCE_PATH, List.of(root));
        manager.setLocationFromPaths(StandardLocation.MODULE_PATH, List.of());
        var compilerOutput = new StringWriter();
        var task = (JavacTask) compiler.getTask(compilerOutput, manager, diagnostics,
            List.of("-proc:none", "-implicit:none", "--release", release, "-encoding", encoding, "-Xlint:none", "-Xmaxerrs", "1000000"),
            null, manager.getJavaFileObjectsFromPaths(files));
        task.setProcessors(List.of());
        var units = new ArrayList<CompilationUnitTree>();
        task.parse().forEach(units::add);
        var errors = diagnostics.getDiagnostics().stream()
            .filter(item -> item.getKind() == Diagnostic.Kind.ERROR).map(item -> diagnostic(root, item)).sorted().toList();
        if (!errors.isEmpty()) throw new IllegalStateException(String.join("\n", errors));
        Set<Tree> authored = Collections.newSetFromMap(new IdentityHashMap<>());
        var recorder = new TreeScanner<Void, Void>() {
            @Override public Void scan(Tree tree, Void unused) {
                if (tree != null) authored.add(tree);
                return super.scan(tree, unused);
            }
        };
        units.forEach(unit -> recorder.scan(unit, null));
        task.analyze();
        var index = new Declarations(root, Trees.instance(task), authored);
        units.forEach(unit -> index.scan(unit, null));
        var uses = new Uses(index, diagnostics.getDiagnostics());
        units.forEach(unit -> uses.scan(unit, null));
        var trees = Trees.instance(task);
        var assigned = HttpPaths.assignedVariables(index.authored, trees);
        var http = new Http(index, trees, assigned);
        units.forEach(unit -> http.scan(unit, null));
        var retrofit = new RetrofitRequests(index, trees);
        units.forEach(unit -> retrofit.scan(unit, null));
        var okHttp = new OkHttpRequests(index, trees, assigned);
        units.forEach(unit -> okHttp.scan(unit, null));
        var requests = new ArrayList<Object>(http.requests);
        requests.addAll(retrofit.requests);
        requests.addAll(okHttp.requests);
        var messages = new ArrayList<Object>();
        // The plugin folds the unresolved-name errors among these into one summary.
        for (var item : diagnostics.getDiagnostics()) {
            messages.add(message(root, item, "warning", item.getCode(), item.getMessage(Locale.ROOT)));
        }
        messages.addAll(uses.diagnostics());
        return Json.object(
            "schemaVersion", 1,
            "scanner", Json.object("id", "java", "technology", "java", "engine", "javac-tree", "engineVersion", Runtime.version().toString()),
            "roots", List.of(Json.object("id", "java:source-set", "kind", "java-project", "name", root.getFileName().toString())),
            "files", index.files(), "entryPoints", index.entryPoints(), "operations", index.operations,
            "invocations", uses.invocations, "httpEndpoints", http.endpoints,
            "httpRequests", requests, "diagnostics", messages);
    }

    private static String diagnostic(Path root, Diagnostic<? extends JavaFileObject> item) {
        String location = item.getSource() == null ? "compiler" : file(root, item.getSource());
        return location + ":" + item.getLineNumber() + ": " + item.getCode() + ": " + item.getMessage(Locale.ROOT);
    }

    private static Map<String, Object> message(Path root, Diagnostic<? extends JavaFileObject> item, String severity, String code, String text) {
        var message = Json.object("severity", severity, "code", code, "message", text);
        if (item.getSource() != null) message.put("file", file(root, item.getSource()));
        if (item.getLineNumber() > 0) message.put("line", item.getLineNumber());
        return message;
    }

    /** A source file's repository-relative path with forward slashes, as every fact names it. */
    static String file(Path root, JavaFileObject source) {
        return root.relativize(Path.of(source.toUri())).toString().replace('\\', '/');
    }
}
