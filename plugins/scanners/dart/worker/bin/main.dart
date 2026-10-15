import 'dart:convert';
import 'dart:io';
import 'package:analyzer/dart/analysis/utilities.dart';
import '../lib/source.dart';
import '../lib/language_versions.dart';

// Input contains selected source and pubspec text. The worker never opens project files.
Future<void> main() async {
  try {
    final request = jsonDecode(await stdin.transform(utf8.decoder).join()) as List;
    final versions = LanguageVersions(request);
    final files = <Map<String, Object?>>[];
    for (final input in request) {
      final file = input['file'] as String;
      if (!file.endsWith('.dart')) continue;
      final source = input['source'] as String;
      // File.readAsString normally consumes a BOM; a space keeps physical UTF-16 offsets intact.
      final content = source.startsWith('\uFEFF') ? ' ${source.substring(1)}' : source;
      final result = parseString(content: content, path: file,
          featureSet: versions.forFile(file), throwIfDiagnostics: false);
      if (result.errors.isNotEmpty) {
        final errors = result.errors.map((error) =>
            '$file:${result.lineInfo.getLocation(error.offset).lineNumber}: ${error.message}');
        throw FormatException(errors.join('\n'));
      }
      files.add(SourceEvidence(file, result).read());
    }
    stdout.write(jsonEncode(files));
  } catch (error) {
    stderr.writeln('dart: $error');
    exitCode = 1;
  }
}
