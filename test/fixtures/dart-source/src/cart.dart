part of '../main.dart';

class Cart {
  Cart() : total = initial() { ready(); }
  Cart._empty() : total = 0;
  final int total;
  String get caption => label();
  void place() {
    void nested() { wrongLocal(); }
    final callback = () { wrongLambda(); };
    enqueue(() { wrongCallback(); });
    save();
  }
  void _reset() { clear(); }
  static Cart create() => Cart();
}
