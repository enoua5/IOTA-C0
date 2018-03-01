#uses draft 3, which added pre and post processor
JMP &start_program

.var results[8]

.var n
.var tot
.lbl fact
  #init factorial
  MOV :tot 1
  
  #start the body of the function
  .lbl fact_body
  
  #check if n is at or below 1
  .var fact_reached_1
  LOE :n 1 :fact_reached_1
  
  #if it is, exit the function
  .var fact_jump_loc
  TNA :fact_reached_1 &fact_ret &fact_mult :fact_jump_loc
  QJP :fact_jump_loc
  
  #otherwise, tot=tot*(n--)
  .lbl fact_mult
  MUL :n :tot :tot
  DEC :n :n
  
  #recursion!
  CAL &fact_body

  #the exit
  .lbl fact_ret
  RET  
  
.lbl start_program
#for i=1
.var i
MOV :i 1
.var for_loop
LBL :for_loop
  #i<=8
  .var end_of_array
  LOE :i 8 :end_of_array
  .var for_jump
  TNA :end_of_array &continue_for &exit_for :for_jump
  QJP :for_jump
  
  .lbl continue_for
  #get i factorial into tot
  MOV :n :i
  CAL &fact
  
  #put it into results
  .var addr
  ADD :results :i :addr
  DEC :addr :addr
  ADR :addr :addr
  SET :addr :tot
  
  #i++
  INC :i :i
QJP :for_loop
.lbl exit_for

.lbl exit_program
JMP &exit_program
