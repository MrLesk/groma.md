package md.groma.cobol;

import com.google.inject.AbstractModule;
import com.google.inject.Guice;
import com.google.inject.util.Modules;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.eclipse.lsp.cobol.cli.di.CliModule;
import org.eclipse.lsp.cobol.common.AnalysisConfig;
import org.eclipse.lsp.cobol.common.LanguageEngineFacade;
import org.eclipse.lsp.cobol.common.copybook.CopybookProcessingMode;
import org.eclipse.lsp.cobol.common.io.ResolveCopybookUri;
import org.eclipse.lsp.cobol.common.io.ResolveFileContent;
import org.eclipse.lsp.cobol.service.settings.CachingConfigurationService;

/** The editor engine sees only the host-selected source snapshot, with no editor or disk lookup. */
final class Engine {
    static LanguageEngineFacade create(Path root, Map<String, String> sources, List<String> paths) {
        return Guice.createInjector(Modules.override(new CliModule()).with(new AbstractModule() {
            @Override protected void configure() {
                bind(CachingConfigurationService.class).toInstance(new SourceSettings());
                bind(ResolveCopybookUri.class).toInstance((uri, name, dialect) ->
                    CompletableFuture.completedFuture(copybook(root, sources, paths, name.getDisplayName())));
                bind(ResolveFileContent.class).toInstance(uri -> CompletableFuture.completedFuture(sources.get(uri)));
            }
        })).getInstance(LanguageEngineFacade.class);
    }

    private static String copybook(Path root, Map<String, String> sources, List<String> paths, String name) {
        for (String directory : paths) {
            // IBM member names are case-insensitive; physical source paths retain their exact spelling.
            String wanted = root.resolve(directory).resolve(name).normalize().toUri().toString();
            List<String> matches = sources.keySet().stream().filter(uri ->
                uri.equalsIgnoreCase(wanted) || uri.equalsIgnoreCase(wanted + ".cpy")).sorted().toList();
            if (matches.size() > 1) throw new IllegalArgumentException("Ambiguous COPY " + name + " in " + directory);
            if (!matches.isEmpty()) return matches.get(0);
        }
        return null;
    }

    /** The upstream visitor requests this concrete service, not just its interface. */
    private static final class SourceSettings extends CachingConfigurationService {
        SourceSettings() { super(null, null, null); }
        @Override public AnalysisConfig getConfig(String uri, CopybookProcessingMode mode) {
            return AnalysisConfig.defaultConfig(mode);
        }
        @Override public List<String> getSubroutineDirectories() { return List.of(); }
        @Override public CompletableFuture<List<String>> getListConfiguration(String uri, String section) {
            return CompletableFuture.completedFuture(List.of());
        }
        @Override public List<String> getDialectWatchingFolders() { return List.of(); }
    }
}
