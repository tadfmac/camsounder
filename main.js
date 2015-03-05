
// pixi.js Renderer作って配置
var stage = new PIXI.Stage(0xFFFFFF);
var width = window.innerWidth;
var height = window.innerHeight;
var renderer = PIXI.autoDetectRenderer(width, height,{resolution:2});
renderer.view.style.width = window.innerWidth + "px";
renderer.view.style.height = window.innerHeight + "px";
renderer.view.style.display = "block";
document.getElementById("pixiview").appendChild(renderer.view);

// カメラ入力
var PIX_W = 8;
var PIX_H = 8;

var imgdatcapture = null;
var video = document.getElementById("video");
var cvcapture=document.getElementById("capture");
var ctxcapture=cvcapture.getContext("2d");
navigator.getUserMedia=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia;
navigator.getUserMedia({"video":true},
function(stream) {
  video.src= window.URL.createObjectURL(stream);
  video.play();
},
function(err){
  alert("Camera Error");
});
function Capture() {
  ctxcapture.drawImage(document.getElementById("video"),0,0,PIX_W,PIX_H);
  imgdatcapture=ctxcapture.getImageData(0,0,PIX_W,PIX_H);
}

// container
var contgr = new PIXI.Graphics();
contgr.beginFill(0xFFFFFF,0);
contgr.drawRect(0,0,width*1.5,height*1.5);
contgr.updateBounds();
contgr.endFill();
var cont = new PIXI.Sprite(contgr.generateTexture(false));
cont.anchor = new PIXI.Point(0.5, 0.5);
cont.position = new PIXI.Point(width/2,height/2);
stage.addChild(cont);

// Matrix
var MatrixObjects = [];

function initMatrix(){
  for(var cnt1 = 0;cnt1 < PIX_W;cnt1 ++){
    MatrixObjects.push(new Array());
    for(var cnt2 = 0;cnt2 < PIX_H;cnt2 ++){
      MatrixObjects[cnt1].push(new Array());
      var color = 0xFF66FF;
      var gr = new PIXI.Graphics();

      gr.anchor = new PIXI.Point(0.5,0.5);
      gr.position = new PIXI.Point(((PIX_W / 2 - 0.5) * 40)-(cnt1 * 40),((PIX_H / 2 - 0.5) * 40) - (cnt2 * 40));
      MatrixObjects[cnt1][cnt2] = gr;
      cont.addChild(MatrixObjects[cnt1][cnt2]);
    }
  }  
}

var pcursor = {x:0,y:0,visible:false,seqnum:0};
var ocursor = pcursor;

var pr,pg,pb;

function Analyze() {
  pr = 0;
  pg = 0;
  pb = 0;
  var pix = imgdatcapture.data;
  var step;
  var target = 0;
  pcursor.x = 0;
  pcursor.y = 0;
  for(var x = 0; x < PIX_W; x++) {
    for(var y = 0; y < PIX_H; y++) {
      var r = pix[(x*y*4)];
      var g = pix[(x*y*4)+1];
      var b = pix[(x*y*4)+2];

      if(r < 128){
        r = 0;
      }
      if(g < 128){
        g = 0;
      }
      if(b < 128){
        b = 0;
      }
      var color = r << 16;
      color |= g << 8;
      color |= b;
      MatrixObjects[x][y].color = color;
      var level = r + g + b;
      pr += r;
      pg += g;
      pb += b;
      if(level > target){
        target = level;
        pcursor.x = x;
        pcursor.y = y;
        pcursor.seqnum = (y*PIX_W) + x;
      }
    }
  }
  pr = Math.floor(pr / (PIX_W * PIX_H));
  pg = Math.floor(pg / (PIX_W * PIX_H));
  pb = Math.floor(pb / (PIX_W * PIX_H));

  if(target < 64){
    pcursor.visible = false;
  }else{
    pcursor.visible = true;
  }
}

initMatrix();

function updateMatrix(){
  for(var x=0;x < PIX_W;x++){
    for(var y=0;y < PIX_H;y++){
      MatrixObjects[x][y].clear();
      MatrixObjects[x][y].lineStyle(0);
      MatrixObjects[x][y].beginFill(MatrixObjects[x][y].color, 0.5);
      MatrixObjects[x][y].drawCircle(0,0,12);
      MatrixObjects[x][y].endFill();
    }
  }
}

// cursor
var cursor = new PIXI.Graphics();
cursor.lineStyle(4,0x9999FF,1);
cursor.anchor = new PIXI.Point(0.5,0.5);
cursor.position = new PIXI.Point((3.5 * 80),(3.5 * 80));
cursor.drawCircle(0,0,40);
cont.addChild(cursor);

var animCurCount = 0;
var ANIM_CUR_COUNT_MAX = 32;

function updateCursor(){
  cursor.clear();
  if(pcursor.visible == true){
    cursor.lineStyle(4,0x9999FF,1);
    cursor.position = new PIXI.Point(((PIX_W / 2 - 0.5) * 40)-(pcursor.x * 40),((PIX_H / 2 - 0.5) * 40) - (pcursor.y * 40));
    cursor.drawCircle(0,0,40);
    if((ocursor.x != pcursor.x) || (ocursor.y != pcursor.y)){
      animCurCount = 0;
      ocursor = pcursor;
    }
  }
}

function animCursor(){
  if(pcursor.visible == true){
    cursor.clear();
    var alpha = 1;
    if(animCurCount){
      alpha = 1 / animCurCount;    
    }
    cursor.lineStyle(4,0x9999FF,alpha);
    cursor.drawCircle(0,0,40+(animCurCount*4));
    animCurCount ++;
    if(animCurCount > ANIM_CUR_COUNT_MAX){
      animCurCount = 0;
    }
  }
}

// 画面リフレッシュに合わせてアニメーション関数呼び出し
requestAnimFrame(animate);

var count = 0;

// アニメーション関数
function animate(){

  requestAnimFrame(animate); // 次の描画タイミングでanimateを呼び出す

  if((count % 15)==0){
    updateCursor();
  }

  if((count % 3)==0){
    Capture();
    Analyze();
    updateMatrix();
    animCursor();
  }

  count ++;
  if(count >= 60){
    count = 0;
  }

  renderer.render(stage);   // 描画する
}

// 音を鳴らす
var oNote = 0;
var neu = neume(new AudioContext());

function Sine($, freq, dur) {
  return $("sin", { freq: freq }).$("xline", { dur: dur }).on("end", $.stop);
}

neu.start();

var freqs = [
  8,8,9,9,10,11,11,12,13,14,15,15,16,17,18,19,
  21,22,23,24,26,28,29,31,33,35,37,39,41,44,46,49,
  52,55,58,62,65,69,73,78,82,87,93,98,104,110,117,123,
  131,139,147,156,165,175,185,196,208,220,233,247,262,277,294,311,
  330,349,370,392,415,440,466,494,523,554,587,623,659,698,740,784,
  831,880,932,988,1047,1109,1175,1245,1319,1397,1480,1568,1661,1760,1865,1976,
  2093,2217,2349,2489,2637,2794,2960,3136,3322,3520,3729,3951,4186,4435,4699,4978,
  5274,5588,5920,6272,6645,7040,7459,7902,8372,8870,9397,9956,10548,11175,11840,12544
];

timer = neu.Interval("16n", function(e) {
  var note = (pcursor.seqnum + 32);
  if(oNote != note){
    var freq = freqs[note];
    var dur = 0.5 * (count % 8);
    neu.Synth(Sine, freq, dur).start(e.playbackTime);
  }
  oNote = note;
}).start();
