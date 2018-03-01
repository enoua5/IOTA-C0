#include <stdint.h>
#include <stdlib.h>

#define IS_BIG_ENDIAN (*(uint16_t *)"\0\xff" < 0x100)

#define MEM_LENGTH 65536
uint16_t mem[MEM_LENGTH];

void run(int);
