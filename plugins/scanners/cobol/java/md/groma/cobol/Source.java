package md.groma.cobol;

import java.util.regex.Pattern;
import org.eclipse.lsp.cobol.common.model.Locality;
import org.eclipse.lsp.cobol.common.model.tree.ProgramIdNode;
import org.eclipse.lsp4j.Position;

/** Converts parser locations to the original UTF-16 source, never to expanded COPY text. */
record Source(String file, String text) {
    int offset(Position position) {
        int offset = 0;
        for (int line = 0; line < position.getLine(); line++) offset = text.indexOf('\n', offset) + 1;
        return offset + position.getCharacter();
    }

    String text(Locality locality) {
        return text.substring(offset(locality.getRange().getStart()), offset(locality.getRange().getEnd()));
    }

    record Name(String value, int line, int position) {}

    Name programName(ProgramIdNode declaration) {
        var range = declaration.getLocality().getRange();
        String[] lines = text.split("\n", -1);
        boolean keyword = false;
        // The parser has already recognized the declaration. Locate its name inside that exact range.
        var tokens = Pattern.compile("[A-Za-z0-9_-]+|\"[^\"]*\"|'[^']*'");
        for (int line = range.getStart().getLine(); line <= range.getEnd().getLine(); line++) {
            String physical = lines[line];
            if (physical.length() > 6 && "*/".indexOf(physical.charAt(6)) >= 0) continue;
            int start = line == range.getStart().getLine() ? range.getStart().getCharacter() : 7;
            int end = line == range.getEnd().getLine() ? range.getEnd().getCharacter() : Math.min(72, physical.length());
            var matcher = tokens.matcher(physical.substring(start, end));
            while (matcher.find()) {
                if (keyword) {
                    String token = matcher.group();
                    String value = unquote(token);
                    if (value == null) value = token.toUpperCase(java.util.Locale.ROOT);
                    return new Name(value, line + 1, offset(new Position(line, start + matcher.start())));
                }
                keyword = matcher.group().equalsIgnoreCase("PROGRAM-ID");
            }
        }
        throw new IllegalArgumentException(file + ": Cannot locate PROGRAM-ID name in original source");
    }

    static String unquote(String token) {
        if (token.length() < 2 || "\"'".indexOf(token.charAt(0)) < 0 || token.charAt(token.length() - 1) != token.charAt(0)) return null;
        String quote = token.substring(0, 1);
        return token.substring(1, token.length() - 1).replace(quote + quote, quote);
    }
}
