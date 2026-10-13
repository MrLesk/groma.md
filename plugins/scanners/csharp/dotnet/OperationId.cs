using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Groma.CSharpScanner;

/// <summary>Operation identity shared by the evidence extractors: a node's position and kind within its file.</summary>
internal static class OperationId
{
    public static string Of(string file, SyntaxNode node) => $"operation:{file}:{node.SpanStart}:{node.RawKind}";

    /// <summary>
    /// The id of a resolved method's own declaration, or null when it is not repository source. It is a position only:
    /// in a file that several projects compile, the project that analyzed the file can declare another member there.
    /// </summary>
    public static string? OfMethod(string repositoryRoot, IMethodSymbol? method) => DeclarationOf(repositoryRoot, method)?.Id;

    /// <summary>
    /// A resolved method's own declaration and its id, as the project that declares the method parses the file. Null when
    /// it is not repository source; a file outside the repository is compilation context only.
    /// </summary>
    public static (string Id, SyntaxNode Node)? DeclarationOf(string repositoryRoot, IMethodSymbol? method)
    {
        if (method is null || method.MethodKind == MethodKind.DelegateInvoke) return null;
        method = (method.ReducedFrom ?? method).OriginalDefinition;
        method = method.PartialImplementationPart ?? method;
        foreach (SyntaxReference declaration in method.DeclaringSyntaxReferences)
        {
            SyntaxNode syntax = declaration.GetSyntax();
            string path = syntax.SyntaxTree.FilePath;
            if (!Path.IsPathRooted(path) || !SourcePath.IsInside(repositoryRoot, path)) return null;
            // Expression-bodied property getters point to the property declaration.
            if (syntax is PropertyDeclarationSyntax { ExpressionBody: not null } property) syntax = property.ExpressionBody;
            if (syntax is IndexerDeclarationSyntax { ExpressionBody: not null } indexer) syntax = indexer.ExpressionBody;
            return (Of(SourcePath.Relative(repositoryRoot, path), syntax), syntax);
        }
        return null;
    }

    /// <summary>
    /// What identifies a declaration to every project that compiles its file: its id, which is where it starts, and the
    /// name written there. Both come from the declaration's own text and nothing a compilation resolves is part of it, so
    /// projects that parse the declaration alike agree on it even when they bind its types differently. Parameters and
    /// bodies are left out on purpose: overloads start at different positions, and a member whose parameters or body
    /// differ between projects is still the one member written at that position.
    /// </summary>
    public static (string Id, string? WrittenName) Identity(string id, SyntaxNode declaration) => (id, declaration switch
    {
        MethodDeclarationSyntax method => method.Identifier.ValueText,
        ConstructorDeclarationSyntax constructor => constructor.Identifier.ValueText,
        LocalFunctionStatementSyntax local => local.Identifier.ValueText,
        // No call names any other operation, so its position alone identifies it.
        _ => null,
    });
}
