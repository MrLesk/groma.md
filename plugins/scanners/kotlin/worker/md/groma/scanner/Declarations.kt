package md.groma.scanner

import org.jetbrains.kotlin.psi.KtLambdaExpression
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtProperty

/** A `val` initialised directly with a lambda or an anonymous function is a named function; a `var` can be reassigned. */
fun KtProperty.isFunctionValue(): Boolean = !isVar && (initializer is KtLambdaExpression || initializer is KtNamedFunction)
