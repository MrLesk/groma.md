import 'package:analyzer/dart/analysis/features.dart';
import 'package:pub_semver/pub_semver.dart';
import 'package:yaml/yaml.dart';

/// Selected pubspecs set parser features only. They never become source owners.
class LanguageVersions {
  final _packages = <String, FeatureSet>{};

  LanguageVersions(List inputs) {
    for (final input in inputs) {
      final file = input['file'] as String;
      if (file == 'pubspec.yaml' || file.endsWith('/pubspec.yaml')) {
        final directory = file.substring(0, file.length - 'pubspec.yaml'.length);
        _packages[directory] = _features(input['source'] as String, file);
      }
    }
  }

  FeatureSet forFile(String file) {
    var directory = '';
    var features = FeatureSet.latestLanguageVersion();
    for (final package in _packages.entries) {
      if (file.startsWith(package.key) && package.key.length >= directory.length) {
        directory = package.key;
        features = package.value;
      }
    }
    return features;
  }
}

FeatureSet _features(String source, String file) {
  try {
    final document = loadYaml(source, sourceUrl: Uri.parse(file)) as YamlMap?;
    final environment = document?['environment'] as YamlMap?;
    final sdk = environment?['sdk'] as String?;
    final constraint = sdk == null ? null : VersionConstraint.parse(sdk);
    final minimum = constraint is VersionRange ? constraint.min : null;
    if (minimum == null) return FeatureSet.latestLanguageVersion();
    return FeatureSet.fromEnableFlags2(
      sdkLanguageVersion: Version(minimum.major, minimum.minor, 0), flags: [],
    );
  } catch (error) {
    throw FormatException('$file: $error');
  }
}
