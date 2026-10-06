package md.groma.cobol;

import ch.qos.logback.classic.LoggerContext;
import com.google.gson.Gson;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.eclipse.lsp.cobol.common.AnalysisConfig;
import org.eclipse.lsp.cobol.common.AnalysisResult;
import org.eclipse.lsp.cobol.common.copybook.CopybookProcessingMode;
import org.eclipse.lsp.cobol.common.model.tree.*;
import org.eclipse.lsp.cobol.common.model.NodeType;
import org.eclipse.lsp4j.DiagnosticSeverity;
import org.slf4j.LoggerFactory;

/** One process owns a complete source snapshot; stdout is one JSON result or nothing on failure. */
public final class Main {
    static final class Input {
        String root;
        Map<String, String> files;
        List<String> copybookPaths;
        boolean outline;
    }
    record Program(String id, String file, String name, int line, int position, boolean topLevel) {}
    record Call(String source, String literal, int line, int position) {}
    record Diagnostic(String severity, String code, String message, String file, int line) {}
    record Result(List<Program> programs, List<Call> calls, List<Diagnostic> diagnostics) {}
    private final Map<String, Source> sources = new LinkedHashMap<>();
    private final List<Program> programs = new ArrayList<>();
    private final List<Call> calls = new ArrayList<>();
    private final List<Diagnostic> diagnostics = new ArrayList<>();

    public static void main(String[] args) {
        ((LoggerContext) LoggerFactory.getILoggerFactory()).reset();
        try {
            Gson json = new Gson();
            Input input = json.fromJson(new InputStreamReader(System.in, StandardCharsets.UTF_8), Input.class);
            System.out.println(json.toJson(new Main().analyze(input)));
            System.exit(0);
        } catch (Exception error) {
            System.err.println("cobol: " + error.getMessage());
            System.exit(1);
        }
    }

    private Result analyze(Input input) {
        Path root = Path.of(input.root);
        Map<String, String> content = new LinkedHashMap<>();
        input.files.forEach((file, text) -> {
            String uri = root.resolve(file).toUri().toString();
            sources.put(uri, new Source(file, text));
            content.put(uri, text);
        });
        var engine = Engine.create(root, content, input.copybookPaths);
        var mode = input.outline ? CopybookProcessingMode.SKIP : CopybookProcessingMode.ENABLED;
        for (var entry : sources.entrySet()) {
            if (!entry.getValue().file().toLowerCase(java.util.Locale.ROOT).matches(".*\\.(cbl|cob)$")) continue;
            var result = engine.analyze(entry.getKey(), entry.getValue().text(), AnalysisConfig.defaultConfig(mode));
            checkDiagnostics(result);
            extract(entry.getKey(), result, input.outline);
        }
        return new Result(programs, calls, diagnostics);
    }

    private void checkDiagnostics(AnalysisResult result) {
        List<String> failures = new ArrayList<>();
        result.getDiagnostics().forEach((uri, items) -> {
            Source source = sources.get(uri);
            if (source == null) return;
            for (var item : items) {
                String code = item.getCode() == null ? "COBOL_SYNTAX" : item.getCode().getLeft();
                int line = item.getRange().getStart().getLine() + 1;
                boolean context = "missing copybook".equals(code) || "semantics.notDefined".equals(code);
                if (item.getSeverity() == DiagnosticSeverity.Error && !context) {
                    failures.add(source.file() + ":" + line + ": " + item.getMessage());
                }
                diagnostics.add(new Diagnostic("warning", code, item.getMessage(), source.file(), line));
            }
        });
        if (!failures.isEmpty()) throw new IllegalArgumentException(String.join("\n", failures));
    }

    private void extract(String uri, AnalysisResult result, boolean outline) {
        var owners = new IdentityHashMap<ProgramNode, Program>();
        var nodes = result.getRootNode().getDepthFirstStream().toList();
        for (Node node : nodes) {
            if (node instanceof ProgramIdNode declaration && declaration.getSubtype() == ProgramSubtype.Program) {
                ProgramNode owner = declaration.getProgram().orElseThrow();
                if (!uri.equals(declaration.getLocality().getUri())) {
                    throw new IllegalArgumentException("PROGRAM-ID in COPY is outside the supported COBOL scope");
                }
                Source source = sources.get(uri);
                var name = source.programName(declaration);
                var program = new Program(source.file() + ":" + name.position(), source.file(), name.value(),
                    name.line(), name.position(),
                    owner.getProgram().isEmpty());
                programs.add(program);
                owners.put(owner, program);
            }
        }
        if (outline) return;
        for (Node node : nodes) {
            if (node instanceof SubroutineNode call) extractCall(uri, call, owners);
        }
    }

    private void extractCall(String uri, SubroutineNode call, Map<ProgramNode, Program> owners) {
        Program owner = owners.get(call.getProgram().orElse(null));
        if (owner == null) return;
        if (!uri.equals(call.getLocality().getUri())) {
            throw new IllegalArgumentException("CALL in COPY is outside the supported COBOL scope; its expansion needs a separate origin model");
        }
        var literal = call.getDepthFirstStream().filter(node -> node instanceof SubroutineNameNode
            && node.getNearestParentByType(NodeType.SUBROUTINE).orElse(null) == call).findFirst();
        String target = literal.map(node -> Source.unquote(sources.get(uri).text(node.getLocality()))).orElse(null);
        var start = call.getLocality().getRange().getStart();
        calls.add(new Call(owner.id(), target, start.getLine() + 1, sources.get(uri).offset(start)));
    }
}
