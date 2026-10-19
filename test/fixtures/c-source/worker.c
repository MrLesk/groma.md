#include "api.h"
#include "not-selected.h"
/* 😀 physical UTF-16 offsets */
static int hidden(int value);
extern int hidden(int value);
int hidden(int value) { return submit(value); }
int *pointer_result(void) { return 0; }
int (*pointer_variable)(int);
int (*factory(void))(int) { return pointer_variable; }
void run(struct Service *service, int (*callback)(int)) {
    callback(1);
    service->dispatch(2);
    (*pointer_variable)(3);
    sizeof(not_executed());
    int nested(void) { return only_nested(); }
    nested();
}
#if PRIVATE
static int selected(void);
#else
int selected(void);
#endif
int selected(void) { return branch(); }
#if PRIVATE
static int alternative(void) { return private_branch(); }
#else
int alternative(void) { return public_branch(); }
#endif
#define CHECK(x) 1
#define OTHER(x) 0
void configured(void) {
#if CHECK(1)
    if_work();
#elif OTHER(2)
    elif_work();
#else
    else_work();
#endif
}
