#include <time.h>

uint16_t reg[2];

#define STACK_LENGTH 64
uint16_t stackA[STACK_LENGTH];
int lengthA=0;
uint16_t stackB[STACK_LENGTH];
int lengthB=0;

void runCRAM();
void step();
