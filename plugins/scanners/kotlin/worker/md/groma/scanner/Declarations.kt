package md.groma.scanner

import org.jetbrains.kotlin.psi.KtLambdaExpression
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtProperty

/** A property initialised directly with a lambda or an anonymous function is a named function. */
fun KtProperty.isFunctionValue(): Boolean = initializer is KtLambdaExpression || initializer is KtNamedFunction
