(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const canvas = $("page-canvas");
  const ctx = canvas.getContext("2d");
  const STORAGE_KEY = "tlc-storyworks-book-page-settings-v1";
  const DEFAULTS = {
    format:"portrait", style:"neutral", paper:"#f8f5ee", ink:"#292724",
    font:"Georgia", fontSize:27, lineHeight:1.55, align:"left", margin:11,
    paragraphSpace:.8, headerMode:"none", pageNumber:"none", pageNumberText:"1",
    divider:"none"
  };
  const controlIds = Object.keys(DEFAULTS);
  const styles = {
    neutral:{paper:"#f8f5ee",ink:"#292724"},
    classic:{paper:"#f4ecd9",ink:"#30291f"},
    modern:{paper:"#ffffff",ink:"#202020"},
    dark:{paper:"#211f25",ink:"#f1e9df"}
  };
  let settings = loadSettings();
  let lastLayout = null;

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === "object" ? {...DEFAULTS,...saved} : {...DEFAULTS};
    } catch { return {...DEFAULTS}; }
  }
  function saveSettings() {
    try {
      const safe = {...settings};
      localStorage.setItem(STORAGE_KEY,JSON.stringify(safe));
    } catch {}
  }
  function readControls() {
    settings = {
      format:$("format").value, style:$("style").value,
      paper:$("paper").value, ink:$("ink").value, font:$("font").value,
      fontSize:Number($("font-size").value), lineHeight:Number($("line-height").value),
      align:$("align").value, margin:Number($("margin").value),
      paragraphSpace:Number($("paragraph-space").value), headerMode:$("header-mode").value,
      pageNumber:$("page-number").value, pageNumberText:$("page-number-text").value.trim(),
      divider:$("divider").value
    };
    updateOutputs();
    saveSettings();
  }
  function updateOutputs() {
    $("paper-value").value=settings.paper;
    $("ink-value").value=settings.ink;
    $("font-size-value").value=settings.fontSize+" px";
    $("line-height-value").value=settings.lineHeight.toFixed(2).replace(/0$/,"")+"×";
    $("margin-value").value=settings.margin+"%";
    $("paragraph-space-value").value=settings.paragraphSpace.toFixed(1)+"×";
  }
  function applySettingsToControls() {
    for (const id of controlIds) {
      const el=$(id.replace(/[A-Z]/g,m=>"-"+m.toLowerCase()));
      if (el) el.value=settings[id];
    }
    updateOutputs();
  }
  function setStylePreset(name) {
    if (!styles[name]) return;
    settings.style=name;
    settings.paper=styles[name].paper;
    settings.ink=styles[name].ink;
    $("style").value=name;
    $("paper").value=settings.paper;
    $("ink").value=settings.ink;
    updateOutputs();
  }
  function dimensions() {
    return settings.format==="square" ? {width:1800,height:1800} : {width:1600,height:2200};
  }
  function splitWords(text) { return text.trim() ? text.trim().split(/\s+/) : []; }
  function wrapParagraph(text,maxWidth) {
    const words=splitWords(text);
    const lines=[];
    let line="";
    for(const word of words) {
      const candidate=line ? line+" "+word : word;
      if(line && ctx.measureText(candidate).width>maxWidth) { lines.push(line); line=""; }
      let fragment="";
      for(const character of word) {
        const next=fragment+character;
        if(fragment && ctx.measureText(next).width>maxWidth) {
          if(line) { lines.push(line); line=""; }
          lines.push(fragment);
          fragment=character;
        } else fragment=next;
      }
      if(fragment) {
        const joined=line ? line+" "+fragment : fragment;
        if(line && ctx.measureText(joined).width>maxWidth) { lines.push(line); line=fragment; }
        else line=joined;
      }
    }
    if(line) lines.push(line);
    return lines;
  }
  function drawJustifiedLine(text,x,y,maxWidth,isLast) {
    if(settings.align!=="justify" || isLast || !text.includes(" ")) {
      ctx.textAlign="left"; ctx.fillText(text,x,y); return;
    }
    const words=text.split(" ");
    const wordsWidth=words.reduce((sum,word)=>sum+ctx.measureText(word).width,0);
    const gap=(maxWidth-wordsWidth)/(words.length-1);
    if(!Number.isFinite(gap) || gap<0 || gap>settings.fontSize*1.5) { ctx.textAlign="left"; ctx.fillText(text,x,y); return; }
    let cursor=x;
    for(const word of words) { ctx.fillText(word,cursor,y); cursor+=ctx.measureText(word).width+gap; }
  }
  function drawDivider(cx,y) {
    ctx.save();
    ctx.fillStyle=settings.ink;
    ctx.strokeStyle=settings.ink;
    ctx.globalAlpha=.8;
    if(settings.divider==="dots" || settings.divider==="asterisks") {
      ctx.font=(settings.divider==="dots"?"20px Georgia":"24px Georgia");
      ctx.textAlign="center";
      ctx.fillText(settings.divider==="dots"?"•  •  •":"*  *  *",cx,y);
    } else if(settings.divider==="flourish") {
      ctx.font="34px Georgia"; ctx.textAlign="center"; ctx.fillText("❦",cx,y+4);
    } else if(settings.divider==="line") {
      ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-55,y-7); ctx.lineTo(cx+55,y-7); ctx.stroke();
    }
    ctx.restore();
  }
  function layoutPage() {
    const {width,height}=dimensions();
    const margin=width*settings.margin/100;
    const top=height*(settings.format==="square"?.105:.09);
    const bottom=height*(settings.format==="square"?.095:.085);
    const contentWidth=width-margin*2;
    const headerText=settings.headerMode==="title"?$("book-title").value.trim():settings.headerMode==="author"?$("author").value.trim():"";
    const bookTitle=$("book-title").value.trim(), author=$("author").value.trim();
    const chapter=$("chapter").value.trim(), subtitle=$("subtitle").value.trim();
    const socialPlatforms = [
      ["bluesky","BS"],["instagram","IG"],["tiktok","TT"],["youtube","YT"],
      ["twitch","TW"],["threads","TH"],["x","X"],["website","↗"]
    ].filter(([id]) => $("social-"+id).checked && $("social-"+id+"-value").value.trim())
      .map(([id,icon]) => ({id,icon,label:({bluesky:"Bluesky",instagram:"Instagram",tiktok:"TikTok",youtube:"YouTube",twitch:"Twitch",threads:"Threads",x:"X",website:"Website"})[id],value:$("social-"+id+"-value").value.trim()}));
    ctx.font=settings.fontSize+"px "+JSON.stringify(settings.font)+", Georgia, serif";
    const lineHeight=settings.fontSize*settings.lineHeight;
    let y=top;
    const headerLines=[];
    if(headerText) {
      ctx.font="16px "+JSON.stringify(settings.font)+", Georgia, serif";
      headerLines.push(headerText.toUpperCase());
      y+=24;
    }
    y+=height*.015;
    const creditFont=Math.max(25,Math.round(settings.fontSize*.95));
    if(bookTitle || author) y+=creditFont*1.5 + 26;
    if(chapter) {
      ctx.font="bold "+Math.round(settings.fontSize*1.2)+"px "+JSON.stringify(settings.font)+", Georgia, serif";
      const titleLines=wrapParagraph(chapter,contentWidth);
      y+=titleLines.length*Math.round(settings.fontSize*1.65);
      if(subtitle) { ctx.font="italic "+Math.round(settings.fontSize*.85)+"px "+JSON.stringify(settings.font)+", Georgia, serif"; y+=Math.round(settings.fontSize*1.3); }
      if(settings.divider!=="none") y+=settings.fontSize*1.5;
      y+=settings.fontSize*1.2;
    }
    const bodyTop=y;
    const text=$("excerpt").value.replace(/\r\n?/g,"\n");
    const paragraphs=text.split(/\n\s*\n/).map(p=>p.replace(/\n/g," ").trim()).filter(Boolean);
    const bodyFont=settings.fontSize;
    ctx.font=bodyFont+"px "+JSON.stringify(settings.font)+", Georgia, serif";
    const bodyLines=[];
    for(let p=0;p<paragraphs.length;p++) {
      const lines=wrapParagraph(paragraphs[p],contentWidth);
      for(let i=0;i<lines.length;i++) bodyLines.push({text:lines[i],last:i===lines.length-1,paragraphLast:i===lines.length-1&&p===paragraphs.length-1});
      if(p<paragraphs.length-1) bodyLines.push({space:true});
    }
    const lineY=[];
    let cursor=bodyTop;
    for(const line of bodyLines) {
      if(line.space) cursor+=lineHeight*settings.paragraphSpace;
      else { lineY.push({line,y:cursor}); cursor+=lineHeight; }
    }
    const contentBottom=height-bottom-(settings.pageNumber!=="none"?height*.045:0);
    const overflow=cursor-lineHeight>contentBottom+1;
    const footerHeight=socialPlatforms.length ? 86 : 0;
    return {width,height,margin,top,bottom,contentWidth,headerText,headerLines,bookTitle,author,socialPlatforms,chapter,subtitle,bodyTop,bodyLines,lineY,contentBottom:contentBottom-footerHeight,overflow:cursor-lineHeight>contentBottom-footerHeight+1,headerHeight:top,footerHeight};
  }
  function renderPage() {
    const {width,height}=dimensions();
    canvas.width=width; canvas.height=height;
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle=settings.paper; ctx.fillRect(0,0,width,height);
    ctx.fillStyle=settings.ink; ctx.strokeStyle=settings.ink;
    const layout=layoutPage();
    const {margin,top,contentWidth,headerText,bookTitle,author,socialPlatforms,chapter,subtitle}=layout;
    const center=width/2;
    if(headerText) {
      ctx.save(); ctx.globalAlpha=.75; ctx.font="16px "+JSON.stringify(settings.font)+", Georgia, serif"; ctx.textAlign="center";
      ctx.fillText(headerText.toUpperCase(),center,top+12,contentWidth); ctx.restore();
      ctx.save(); ctx.globalAlpha=.45; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(margin,top+28); ctx.lineTo(width-margin,top+28); ctx.stroke(); ctx.restore();
    }
    let y=top;
    if(headerText) y+=24;
    y+=height*.015;
    if(bookTitle || author) {
      const creditFont=Math.max(25,Math.round(settings.fontSize*.95));
      ctx.font="bold "+creditFont+"px "+JSON.stringify(settings.font)+", Georgia, serif";
      ctx.textAlign="left";
      if(bookTitle) ctx.fillText(bookTitle,margin,y+creditFont,contentWidth*.58);
      ctx.font=creditFont+"px "+JSON.stringify(settings.font)+", Georgia, serif";
      ctx.textAlign="right";
      if(author) ctx.fillText(author,width-margin,y+creditFont,contentWidth*.38);
      y+=creditFont*1.5;
      ctx.save(); ctx.globalAlpha=.5; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(margin,y+8); ctx.lineTo(width-margin,y+8); ctx.stroke(); ctx.restore();
      y+=26;
    }
    if(chapter) {
      ctx.textAlign="center"; ctx.font="bold "+Math.round(settings.fontSize*1.2)+"px "+JSON.stringify(settings.font)+", Georgia, serif";
      const titleLines=wrapParagraph(chapter,contentWidth);
      for(const line of titleLines) { y+=Math.round(settings.fontSize*1.65); ctx.fillText(line,center,y,contentWidth); }
      if(subtitle) { ctx.font="italic "+Math.round(settings.fontSize*.85)+"px "+JSON.stringify(settings.font)+", Georgia, serif"; y+=Math.round(settings.fontSize*1.3); ctx.fillText(subtitle,center,y,contentWidth); }
      if(settings.divider!=="none") { y+=settings.fontSize*1.1; drawDivider(center,y); }
    }
    ctx.save();
    const clipTop=layout.bodyTop-settings.fontSize*1.25;
    ctx.beginPath(); ctx.rect(margin,clipTop,contentWidth,Math.max(0,layout.contentBottom-clipTop)); ctx.clip();
    ctx.font=settings.fontSize+"px "+JSON.stringify(settings.font)+", Georgia, serif";
    ctx.fillStyle=settings.ink; ctx.textBaseline="alphabetic";
    for(const item of layout.lineY) {
      if(settings.align==="justify") drawJustifiedLine(item.line.text,margin,item.y,contentWidth,item.line.paragraphLast);
      else { ctx.textAlign="left"; ctx.fillText(item.line.text,margin,item.y); }
    }
    ctx.restore();
    if(socialPlatforms.length) {
      ctx.save(); ctx.fillStyle=settings.ink; ctx.strokeStyle=settings.ink;
      const footerY=height-layout.bottom-52;
      ctx.globalAlpha=.45; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(margin,footerY-18); ctx.lineTo(width-margin,footerY-18); ctx.stroke();
      ctx.globalAlpha=.9;
      const gap=24, iconSize=34, labelGap=9, itemGap=26;
      ctx.font="18px "+JSON.stringify(settings.font)+", Georgia, serif";
      const measured=socialPlatforms.map(item=>({...item,shown:item.value.replace(/^https?:\/\//,"").replace(/\/$/,""),textWidth:Math.min(ctx.measureText(item.value.replace(/^https?:\/\//,"").replace(/\/$/,"")).width,210)}));
      const totalWidth=measured.reduce((sum,item)=>sum+iconSize+labelGap+item.textWidth,0)+itemGap*Math.max(0,measured.length-1);
      let x=Math.max(margin,(width-totalWidth)/2), yIcon=footerY+2, row=0;
      for(const item of measured) {
        const itemWidth=iconSize+labelGap+item.textWidth;
        if(x+itemWidth>width-margin && x>margin) { row++; x=margin; yIcon=footerY+2+row*42; }
        ctx.save();
        ctx.beginPath(); ctx.arc(x+iconSize/2,yIcon+iconSize/2,iconSize/2,0,Math.PI*2);
        ctx.globalAlpha=.14; ctx.fill(); ctx.globalAlpha=.95;
        ctx.font="bold 13px Arial, sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(item.icon,x+iconSize/2,yIcon+iconSize/2);
        ctx.font="18px "+JSON.stringify(settings.font)+", Georgia, serif"; ctx.textAlign="left"; ctx.textBaseline="middle";
        ctx.fillText(item.shown,x+iconSize+labelGap,yIcon+iconSize/2,item.textWidth);
        ctx.restore();
        x+=itemWidth+itemGap;
      }
      ctx.restore();
    }
    if(settings.pageNumber!=="none" && settings.pageNumberText) {
      ctx.save(); ctx.globalAlpha=.85; ctx.font="18px "+JSON.stringify(settings.font)+", Georgia, serif";
      const numberY=height-layout.bottom*.42;
      if(settings.pageNumber==="center") { ctx.textAlign="center"; ctx.fillText(settings.pageNumberText,center,numberY); }
      else { ctx.textAlign="right"; ctx.fillText(settings.pageNumberText,width-margin,numberY); }
      ctx.restore();
    }
    lastLayout=layout;
    updateStatus(layout);
  }
  function updateStatus(layout) {
    const words=splitWords($("excerpt").value).length;
    $("word-count").textContent=words+" "+(words===1?"word":"words");
    $("character-count").textContent=$("excerpt").value.length+" characters";
    const status=$("fit-status"), message=$("overflow-message");
    if(!$("excerpt").value.trim()) {
      status.textContent="Add an excerpt to begin."; status.className="fit-status";
      message.hidden=true; $("download").disabled=true;
    } else if(layout.overflow) {
      status.textContent="Text exceeds page"; status.className="fit-status warning";
      message.hidden=false;
      message.textContent="This excerpt doesn't fit in the current page area. Your typography and layout settings have been preserved. Shorten the excerpt, choose a different format, reduce margins, or adjust the type size/spacing before exporting.";
      $("download").disabled=true;
    } else {
      status.textContent="Fits on the page"; status.className="fit-status good";
      message.hidden=true; $("download").disabled=false;
    }
  }
  function download() {
    if(!lastLayout || lastLayout.overflow || !$("excerpt").value.trim()) return;
    const link=document.createElement("a");
    const title=($("book-title").value.trim()||"book-page").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)||"book-page";
    link.download=title+"-"+settings.format+".png";
    link.href=canvas.toDataURL("image/png");
    link.click();
  }
  function resetSettings() {
    settings={...DEFAULTS};
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    applySettingsToControls();
    renderPage();
  }
  function bindEvents() {
    for(const id of ["format","font","font-size","line-height","align","margin","paragraph-space","header-mode","page-number","page-number-text","divider","paper","ink"]) {
      $(id).addEventListener("input",()=>{ readControls(); renderPage(); });
      $(id).addEventListener("change",()=>{ readControls(); renderPage(); });
    }
    $("style").addEventListener("change",()=>{setStylePreset($("style").value);saveSettings();renderPage();});
    $("excerpt").addEventListener("input",renderPage);
    for(const id of ["book-title","author","chapter","subtitle"]) $(id).addEventListener("input",renderPage);
    for(const id of ["bluesky","instagram","tiktok","youtube","twitch","threads","x","website"]) {
      $("social-"+id).addEventListener("change",renderPage);
      $("social-"+id+"-value").addEventListener("input",renderPage);
    }
    $("download").addEventListener("click",download);
    $("reset-settings").addEventListener("click",resetSettings);
  }
  applySettingsToControls();
  bindEvents();
  renderPage();
})();