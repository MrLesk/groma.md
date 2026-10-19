library shop;
import 'package:flutter/widgets.dart';
part 'src/cart.dart';
part 'src/missing.dart';
part 'src/not_a_part.dart';

void main() { runApp(const Shop()); }
final transform = (String input) => input.trim();
void _save() { persist(); }
class Shop extends StatelessWidget {
  const Shop();
  Widget build(BuildContext context) {
    return Button(onPressed: () { _save(); });
  }
}
