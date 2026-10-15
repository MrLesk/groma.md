#ifndef API_H
#define API_H
struct Service {
    int (*dispatch)(int);
    struct Nested { int value; } nested;
};
union Payload { int count; double value; };
enum State { READY, STOPPED };
typedef struct Tagged { int value; } Alias;
typedef int (*Callback)(int);
typedef struct { int value; } Anonymous;
extern int submit(int value);
static inline int local_header(int value) { return submit(value); }
#endif
