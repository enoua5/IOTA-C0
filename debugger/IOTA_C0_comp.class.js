class IOTA_C0_comp
{
  //tools
  static mod(n, m=0x10000)
  {
    return ((n%m)+m)%m;
  }
  static escapeRegExp(str)
  {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
  static toAddress(n)
  {
    if(n[0]=="&") return n;
    return n|0x8000;
  }
  static toOutputString(n)
  {
    return n.toString();
  }
  static clean(asm)
  {
    //Remove white space
    asm=asm.replace(/^\s+/gm, '');
    asm=asm.replace(/\s+$/gm, '');
    //remove comments
    asm=asm.replace(/#.*$/gm,"");
    //remove empty lines
    asm=asm.replace(/\n$/gm,"");
    
    return asm;
  }
  //compilation
  static preprocess(asm)
  {
    let varFinder=(/^\.var\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\[([1-9][0-9]*)\])?$/gm);
    let constFinder=(/^\.const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(.*)$/gm);
    
    let consts=[];
    
    //find all vars
    let pointer=0xFFFF;
    let match;
    while((match=varFinder.exec(asm))!=null)
    {
      let name=match[1];
      if(!name.match(/[a-zA-Z_][a-zA-Z0-9_]*/))
        throw "Error: "+name+" is not a valid identifier";
      
      if(match[2])
      {
        //this is an array
        let number=parseInt(match[2]);
        for(let i=number-1; i>=0; i--)
        {
          consts.push({
              name: name+"["+i+"]",
              value: '*'+(pointer--)
            });
        }
        //the address of the array
        consts.push({
          name: name,
          value: pointer+1-0x8000
        });
      }
      else
      {
        consts.push({
            name: name,
            value: '*'+(pointer--)
          });
      }
    }
    
    //find all consts
    while((match=constFinder.exec(asm))!=null)
    {
      let name=match[1];
      if(!name.match(/[a-zA-Z_][a-zA-Z0-9_]*/))
        throw "Error: "+name+" is not a valid identifier";
      
      consts.push({
          name: name,
          value: match[2]
        });
    }
    
    //remove all declarations
    asm=asm.replace(varFinder, "");
    asm=asm.replace(constFinder, "");
    
    //replace all references
    for(let i of consts)
    {
      let finder=RegExp("(?:"+this.escapeRegExp(":"+i.name)+")(\\s+|$)",'gm');
      asm=asm.replace(finder, i.value+"$1");
    }
    
    //for debugging
    window.info=consts.map(e => e.value[0]=='*'?{value: parseInt(e.value.split('*')[1])|0x8000, name: e.name}:e);
    return asm;
  }
  static splitCmd(asm)
  {
    //split into an array of commands
    asm=asm.split('\n');
    //get rid of any stray blanks
    asm=asm.filter((s)=>s!="");
    
    return asm;
  }
  static parse(asm)
  {
    //split the commands into commands and args
    asm=asm.map((s)=>s.split(/\s+/g));
    //make into more workable objects
    asm=asm.map((a)=>({
      cmd: a[0],
      arg: a.slice(1, a.length)
    }));
    
    //parse numbers
    for(let l of asm)
    {
      //check if the command is a postprocessor instruction
      if(l.cmd[0]=='.')
        continue;
      
      //seperate asterisk
      l.arg=l.arg.map((s)=>({
        pointer: s[0]=='*',
        number: s[0]=='*'?s.substr(1, s.length):s
      }));
      //parse int
      l.arg=l.arg.map((s)=>{
        //check if the number is a postprocessor target
        if(s.number[0]=='&') return s;
        
        let radixes=[
          {regex: /^0[Bb][0-1]+$/, radix:2},
          {regex: /^0[0-7]+$/, radix:8},
          {regex: /^0$|^[1-9]\d*$/, radix:10},
          {regex: /^0[Xx][0-9a-fA-F]+$/, radix:16}
        ];
        let radix=-1;
        for(let r of radixes)
          radix=s.number.match(r.regex)?r.radix:radix;
        if(radix<0) throw "Invalid Number Error: "+s.number;
        return {
          pointer: s.pointer,
          number: this.mod(parseInt(s.number, radix), 0x10000)
        };
      });
      //take into consideration the asterisk
      l.arg=l.arg.map(n=>n.number[0]=='&'?n.number:n.pointer?n.number|0x8000:n.number);
    }
    
    return asm;
  }
  static postprocess(prg)
  {
    prg=prg.split('\n');
    
    //Get the useful info from all postprocessor instructions
    let skip=(/^$|^\./);
    let labels=[];
    let p=0x0100;
    for(let l of prg)
    {
      if(!l.match(skip))
        p+=1;
      if(l[0]=='.')
      {
        let cmd=l.match(/^\.([^\s]*)/)[1].toLowerCase();
        let arg=l.match(/^\.[^\s]*\s+(.*)$/)[1].split(/\s+/);
        
        switch(cmd)
        {
          case "lbl":
            labels.push({
                name: arg[0],
                loc: p
              });
            break;
          default:
            throw "Unrecognized Symbol Error: "+cmd;
        }
      }
    }
    
    //remove all postprocessor instructions
    prg=prg.filter((l)=>l[0]!=".");
    prg=prg.join('\n');
    
    for(let i of labels)
    {
      let finder=RegExp("(?:"+this.escapeRegExp("&"+i.name)+")(\\s+|$)",'gm');
      prg=prg.replace(finder, i.loc+"$1");
    }
  
    return prg;
  }
  static compileAsm(asm)
  {
    let prg="";
    for(let l of asm)
    {
      //check if the command is a postprocessor instruction
      if(l.cmd[0]=='.')
      {
        prg+=l.cmd+" "+l.arg.join(" ")+"\n";
        continue;
      }
      
      let arg=l.arg;
      switch(l.cmd.toUpperCase())
      {
        case "NOP":
          prg+="0\n0\n";
          break;
        case "MOV":
          arg[0]=this.toAddress(arg[0]);
          prg+=arg[0].toString()+'\n'+arg[1].toString()+'\n';
          break;
        case "JMP":
          prg+="32838\n"+arg[0].toString()+'\n';
          prg+="32768\n32838\n"
          break;
        case "QJP":
          arg[0]=this.toAddress(arg[0]);
          prg+="32768\n"+arg[0].toString()+'\n';
          break;
        case "SET":
          prg+="32769\n"+arg[0].toString()+'\n';
          prg+="32770\n"+arg[1].toString()+'\n';
          break;
        case "STA":
          prg+="32769\n"+arg[0].toString()+'\n';
          break;
        case "STV":
          prg+="32770\n"+arg[0].toString()+'\n';
          break;
        case "TNA":
          prg+="32771\n"+arg[0].toString()+'\n';
          prg+="32772\n"+arg[1].toString()+'\n';
          prg+="32773\n"+arg[2].toString()+'\n';
          if(arg.length>=4)
          {
            arg[3]=this.toAddress(arg[3]);
            prg+=arg[3].toString()+'\n'+"32774\n";
          }
          break;
        case "TRN":
          prg+="32775\n"+arg[0].toString()+'\n';
          prg+="32776\n"+arg[1].toString()+'\n';
          prg+="32777\n"+arg[2].toString()+'\n';
          if(arg.length>=4)
          {
            arg[3]=this.toAddress(arg[3]);
            prg+=arg[3].toString()+'\n'+"32778\n";
          }
          break;
        case "AND":
          prg+="32779\n"+arg[0].toString()+'\n';
          prg+="32780\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32781\n";
          }
          break;
        case "ORR":
          prg+="32782\n"+arg[0].toString()+'\n';
          prg+="32783\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32784\n";
          }
          break;
        case "XOR":
          prg+="32785\n"+arg[0].toString()+'\n';
          prg+="32786\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32787\n";
          }
          break;
        case "NOT":
          prg+="32788\n"+arg[0].toString()+'\n';
          if(arg.length>=2)
          {
            arg[1]=this.toAddress(arg[1]);
            prg+=arg[1].toString()+'\n'+"32789\n";
          }
          break;
        case "LST":
          prg+="32790\n"+arg[0].toString()+'\n';
          prg+="32791\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32792\n";
          }
          break;
        case "LOE":
          prg+="32793\n"+arg[0].toString()+'\n';
          prg+="32794\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32795\n";
          }
          break;
        case "GRT":
          prg+="32796\n"+arg[0].toString()+'\n';
          prg+="32797\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32798\n";
          }
          break;
        case "GOE":
          prg+="32799\n"+arg[0].toString()+'\n';
          prg+="32800\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32801\n";
          }
          break;
        case "EQU":
          prg+="32802\n"+arg[0].toString()+'\n';
          prg+="32803\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32804\n";
          }
          break;
        case "NEQ":
          prg+="32805\n"+arg[0].toString()+'\n';
          prg+="32806\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32807\n";
          }
          break;
        case "SHR":
          prg+="32808\n"+arg[0].toString()+'\n';
          prg+="32809\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32810\n";
          }
          break;
        case "ASR":
          prg+="32811\n"+arg[0].toString()+'\n';
          prg+="32812\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32813\n";
          }
          break;
        case "SHL":
          prg+="32814\n"+arg[0].toString()+'\n';
          prg+="32815\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32816\n";
          }
          break;
        case "ADD":
          prg+="32817\n"+arg[0].toString()+'\n';
          prg+="32818\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32819\n";
          }
          break;
        case "SUB":
          prg+="32820\n"+arg[0].toString()+'\n';
          prg+="32821\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32822\n";
          }
          break;
        case "MUL":
          prg+="32823\n"+arg[0].toString()+'\n';
          prg+="32824\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32825\n";
          }
          break;
        case "DIV":
          prg+="32826\n"+arg[0].toString()+'\n';
          prg+="32827\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32828\n";
          }
          break;
        case "MOD":
          prg+="32829\n"+arg[0].toString()+'\n';
          prg+="32830\n"+arg[1].toString()+'\n';
          if(arg.length>=3)
          {
            arg[2]=this.toAddress(arg[2]);
            prg+=arg[2].toString()+'\n'+"32831\n";
          }
          break;
        case "INC":
          prg+="32832\n"+arg[0].toString()+'\n';
          if(arg.length>=2)
          {
            arg[1]=this.toAddress(arg[1]);
            prg+=arg[1].toString()+'\n'+"32833\n"
          }
          break;
        case "DEC":
          prg+="32834\n"+arg[0].toString()+'\n';
          if(arg.length>=2)
          {
            arg[1]=this.toAddress(arg[1]);
            prg+=arg[1].toString()+'\n'+"32835\n"
          }
          break;
        case "NEG":
          prg+="32836\n"+arg[0].toString()+'\n';
          if(arg.length>=2)
          {
            arg[1]=this.toAddress(arg[1]);
            prg+=arg[1].toString()+'\n'+"32837\n"
          }
          break;
        case "ADR":
          prg+="32838\n"+arg[0].toString()+'\n';
          if(arg.length>=2)
          {
            arg[1]=this.toAddress(arg[1]);
            prg+=arg[1].toString()+'\n'+"32838\n"
          }
          break;
        case "PSH":
          prg+="32839\n"+arg[0].toString()+'\n';
          prg+="32840\n1\n";
          break;
        case "POP":
          prg+="32842\n1\n";
          if(arg.length>=1)
          {
            arg[0]=this.toAddress(arg[0]);
            prg+=arg[0].toString()+'\n'+"32841\n";
          }
          break;
        case "PSA":
          prg+="32843\n"+arg[0].toString()+'\n';
          prg+="32844\n1\n";
          break;
        case "POA":
          prg+="32846\n1\n";
          if(arg.length>=1)
          {
            arg[0]=this.toAddress(arg[0]);
            prg+=arg[0].toString()+'\n'+"32845\n";
          }
          break;
        case "RND":
          arg[0]=this.toAddress(arg[0]);
          prg+=arg[0].toString()+'\n'+"32847\n";
          break;
        case "GET":
          arg[0]=this.toAddress(arg[0]);
          prg+="32848\n"+arg[0].toString()+'\n';
          if(arg.length>=2)
          {
            arg[1]=this.toAddress(arg[1]);
            prg+=arg[1].toString()+'\n'+"32849\n";
          }
          break;
        case "LBL":
          arg[0]=this.toAddress(arg[0]);
          prg+=arg[0].toString()+'\n'+"32768\n";
          break;
        case "CAL":
          prg+="32817\n8\n";
          prg+="32818\n32768\n";
          prg+="32843\n32819\n";
          prg+="32844\n1\n";
          prg+="32838\n"+arg[0].toString()+'\n';
          prg+="32768\n32838\n";
          break;
        case "RET":
          prg+="32846\n1\n";
          prg+="32768\n32845\n";
          break;
        case "HLT":
          prg+="32895\n1\n";
          break;
        default:
          throw "Unrecognized Symbol Error: "+l.cmd;
      }
    }
    
    return prg;
  }
  static compile(asm)
  {
    //phase 1
    asm=this.clean(asm);
    asm=this.preprocess(asm);
    //phase 2
    asm=this.clean(asm);
    asm=this.splitCmd(asm);
    asm=this.parse(asm);
    let prg=this.compileAsm(asm);
    //phase 3
    prg=this.postprocess(prg);
    return prg;
  }
  
  static load(nums)
  {
    nums=nums.split('\n');
    nums=nums.map(n=>parseInt(n));
    nums=nums.filter(n=>!isNaN(n));
    return new IOTA_C0(nums);
  }
}
