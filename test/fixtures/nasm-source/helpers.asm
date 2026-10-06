section .data
message: db 'hello', 0
section .text
ROUTINE helper
.loop:
    dec ecx
    jnz .loop
    ret
uncalled_branch:
    nop
    ret

