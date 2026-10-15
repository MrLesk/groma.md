abstract interface class Store { void save(); }
mixin _Logging { void _log() { print('log'); } }
enum State {
  ready;
  String label() => name.toUpperCase();
}
extension type OrderId(int value) { int next() => value + 1; }
extension Text on String { String shout() => toUpperCase(); }
typedef Name = String;
