package md.groma.scanner

import org.jetbrains.kotlin.com.intellij.psi.util.PsiTreeUtil
import org.jetbrains.kotlin.psi.KtAnnotated
import org.jetbrains.kotlin.psi.KtAnnotationEntry
import org.jetbrains.kotlin.psi.KtCallExpression
import org.jetbrains.kotlin.psi.KtClass
import org.jetbrains.kotlin.psi.KtClassOrObject
import org.jetbrains.kotlin.psi.KtCollectionLiteralExpression
import org.jetbrains.kotlin.psi.KtEscapeStringTemplateEntry
import org.jetbrains.kotlin.psi.KtExpression
import org.jetbrains.kotlin.psi.KtLiteralStringTemplateEntry
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtStringTemplateExpression
import org.jetbrains.kotlin.psi.KtUserType

/**
 * HTTP endpoints of Spring MVC and WebFlux annotated controllers. Annotations are matched by name and read as
 * written. A route or method that is not literal text is never guessed: it is reported as a blocker, which only
 * possibly takes the requests below its readable prefix.
 */
object Endpoints {
    private val CONTROLLERS = setOf("RestController", "Controller")
    /** A mapping annotation and the method it names; `@RequestMapping` names its methods in `method =`. */
    private val MAPPINGS = mapOf("GetMapping" to "GET", "PostMapping" to "POST", "PutMapping" to "PUT",
        "DeleteMapping" to "DELETE", "PatchMapping" to "PATCH", "RequestMapping" to null)
    private val METHODS = setOf("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE")
    private val TEXT = Regex("[A-Za-z0-9\\-._~!$&'()*+,;=:@%]+")
    /** `{name}`, `{name:regex}` or `{*name}`. */
    private val PLACEHOLDER = Regex("\\{(\\*?)([^}:]*)(:.*)?}")

    /**
     * Stands for route text the scanner sees but cannot read. NUL is not URL path text, so `segments` ends the route
     * at its segment with a constrained optional catch-all.
     */
    private const val UNREADABLE = "\u0000"
    /** Stands for a method the scanner sees but cannot read. */
    private const val ANY = "*"

    /** One mapping annotation as written: its paths, and its methods, where none means every method. */
    private class Mapping(val paths: List<String>, val methods: List<String>)

    /** `types` holds every scanned source, because a controller's class-level mapping may sit on a supertype. */
    fun fromSource(source: Source, operations: List<OperationDecl>, types: Types): List<Map<String, Any?>> {
        val controllers = PsiTreeUtil.collectElementsOfType(source.file, KtClass::class.java).filter(::isController)
        if (controllers.isEmpty()) return emptyList()
        // A named function's operation covers its whole declaration, so the declaration finds its operation.
        val operationOf = operations.associateBy { it.body }
        return controllers.flatMap { controller ->
            val prefix = classMapping(controller, types, mutableSetOf()) ?: Mapping(listOf(""), emptyList())
            controller.declarations.filterIsInstance<KtNamedFunction>().flatMap { function ->
                val operation = operationOf[function] ?: return@flatMap emptyList()
                mappings(function).flatMap { endpoints(operation.id, prefix, it) }
            }
        }
    }

    /** An interface never serves: a declarative client carries the same mapping annotations. */
    private fun isController(type: KtClass): Boolean =
        !type.isInterface() && type.annotationEntries.any { it.shortName?.asString() in CONTROLLERS }

    /**
     * The class-level mapping Spring finds: the class's own, else the first one on its interfaces and then its
     * superclass, searched through their own supertypes. A supertype outside the scanned sources declares none.
     */
    private fun classMapping(type: KtClassOrObject, types: Types, searched: MutableSet<KtClassOrObject>): Mapping? {
        mappings(type).firstOrNull()?.let { return it }
        if (!searched.add(type)) return null
        val supertypes = type.superTypeListEntries.mapNotNull { entry ->
            (entry.typeReference?.typeElement as? KtUserType)?.let { types.resolve(it, type) }
        }
        return supertypes.sortedBy { it !is KtClass || !it.isInterface() }.firstNotNullOfOrNull { classMapping(it, types, searched) }
    }

    /**
     * Spring serves both a class-level method and a mapping's own; a side without a method adds no restriction, and
     * an unreadable method on either side leaves every method possible.
     */
    private fun endpoints(operation: String, prefix: Mapping, mapping: Mapping): List<Map<String, Any?>> {
        val methods = (prefix.methods + mapping.methods).distinct().let { if (it.isEmpty() || ANY in it) listOf(ANY) else it }
        return prefix.paths.flatMap { base -> mapping.paths.flatMap { route -> methods.map { method ->
            mapOf("operation" to operation, "method" to method, "path" to segments("$base/$route"))
        } } }
    }

    private fun mappings(declaration: KtAnnotated): List<Mapping> =
        declaration.annotationEntries.filter { it.shortName?.asString() in MAPPINGS }.map(::mapping)

    /** An unreadable method makes each route unreadable past its path, so the mapping is a blocker, not a match. */
    private fun mapping(annotation: KtAnnotationEntry): Mapping {
        val paths = mutableListOf<String>()
        val methods = listOfNotNull(MAPPINGS[annotation.shortName?.asString()]).toMutableList()
        for (argument in annotation.valueArguments) {
            val values = elements(argument.getArgumentExpression())
            when (argument.getArgumentName()?.asName?.asString()) {
                null, "value", "path" -> paths += values.map(::pathText)
                "method" -> methods += values.map { requestMethod(it) ?: ANY }
                // `params`, `headers`, `consumes` and `produces` narrow a route without changing its path or method.
                else -> {}
            }
        }
        val unknown = if (ANY in methods) "/$UNREADABLE" else ""
        return Mapping(paths.ifEmpty { listOf("") }.map { it + unknown }, methods)
    }

    /** The values of an annotation array, written `[..]` or `arrayOf(..)`, or the single value itself. */
    private fun elements(value: KtExpression?): List<KtExpression?> = when {
        value is KtCollectionLiteralExpression -> value.getInnerExpressions()
        value is KtCallExpression && value.calleeExpression?.text == "arrayOf" -> value.valueArguments.map { it.getArgumentExpression() }
        else -> listOf(value)
    }

    /** A string's text up to its first interpolation. From there on, like a constant or a computed string, it is unreadable. */
    private fun pathText(value: KtExpression?): String {
        if (value !is KtStringTemplateExpression) return UNREADABLE
        val text = StringBuilder()
        for (entry in value.entries) when (entry) {
            is KtLiteralStringTemplateEntry -> text.append(entry.text)
            is KtEscapeStringTemplateEntry -> text.append(entry.unescapedValue)
            else -> return text.append(UNREADABLE).toString()
        }
        return text.toString()
    }

    /** The constant's own name however it is qualified: `RequestMethod.GET`, its fully qualified form, or an imported `GET`. */
    private fun requestMethod(value: KtExpression?): String? =
        value?.text?.substringAfterLast('.')?.trim()?.takeIf { it in METHODS }

    /**
     * Segments of a Spring path pattern. A segment that may span segments or that the fact format cannot state,
     * such as `{*name}`, `**`, a `${..}` configuration placeholder or unreadable text, ends the path with a constrained optional
     * catch-all, so the endpoint is never widened to requests the application may reject.
     */
    private fun segments(pattern: String): List<Map<String, Any?>> {
        val segments = mutableListOf<Map<String, Any?>>()
        for (part in pattern.split('/').filter { it.isNotEmpty() }) {
            val segment = segment(part)
            if (segment == null) {
                segments += mapOf("kind" to "catch-all", "name" to placeholderName(part), "optional" to true, "constrained" to true)
                break
            }
            segments += segment
        }
        return segments
    }

    /** One segment, or null when it may span segments or the format cannot state it. */
    private fun segment(part: String): Map<String, Any?>? {
        if (UNREADABLE in part || "\${" in part || part == "**") return null
        val whole = PLACEHOLDER.matchEntire(part)
        if (whole != null) {
            return if (whole.groupValues[1].isEmpty()) parameter(placeholderName(part), whole.groupValues[3].isNotEmpty()) else null
        }
        if (part == "*") return parameter("*", false)
        // Text mixed with a placeholder or a wildcard accepts only some values of one segment.
        if ('{' in part || '*' in part || '?' in part) return parameter(placeholderName(part), true)
        return if (TEXT.matches(part)) mapOf("kind" to "literal", "value" to part) else null
    }

    private fun parameter(name: String, constrained: Boolean): Map<String, Any?> =
        mapOf("kind" to "parameter", "name" to name) + (if (constrained) mapOf("constrained" to true) else emptyMap())

    /** The first placeholder's name in a segment, or `*` for a wildcard or a name outside URL path characters. */
    private fun placeholderName(part: String): String =
        PLACEHOLDER.find(part)?.groupValues?.get(2)?.trim()?.takeIf { TEXT.matches(it) } ?: "*"
}
