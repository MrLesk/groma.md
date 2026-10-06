; A source comment
%include "macros.inc"
section .text
%ifdef WIN64
global windows_only
ROUTINE windows_only
    ret
%else
global main
ROUTINE main
    call helper
    call .local
    call rax
    CALL_EXTERNAL outside
.loop:
    jmp .done
.local:
    ret
.done:
    ret
%endif
%include "helpers.asm"

