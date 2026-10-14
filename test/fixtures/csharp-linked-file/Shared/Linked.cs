namespace Shared;

// First and Second both compile this file. First, the first by path, is the project that analyzes it.
public static class Linked
{
    // Only Second has the usings that bind List, yet both projects read this one declaration.
    public static int Same(List<int> items) => items.Count;

    // Second defines FLAG, so at this one position First declares Plain and Second declares Flagged.
    public static int
#if FLAG
    Flagged
#else
    Plain
#endif
    () => 1;

#if FLAG
    // Only Second declares this method.
    public static int Extra() => 2;
#endif
}
