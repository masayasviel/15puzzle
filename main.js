// phina.js をグローバル領域に展開
phina.globalize();

// 定数
const SCREEN_WIDTH = 640; // 画面横サイズ
const SCREEN_HEIGHT = 960; // 画面縦サイズ
const N = 4; // 縦横のピース数
const GRID_SIZE = SCREEN_WIDTH / N; // グリッドのサイズ
const PANEL_SIZE = GRID_SIZE * 0.95; // パネルの大きさ
const PANEL_OFFSET = GRID_SIZE / 2; // オフセット値

// MainScene クラスを定義
phina.define("MainScene", {
    superClass: "DisplayScene",
    init: function(){
        this.superInit();
        // グリッド
        const grid = Grid({
            width: SCREEN_WIDTH,
            columns: N,
            offset: PANEL_OFFSET
        });
        // パネルグループ
        this.panelGroup = DisplayElement().addChildTo(this);
        // thisを避難
        let self = this;
        // パネル配置
        for(let x = 0;x < N;x++){
            for(let y = 0;y < N;y++){
                let number = y * N + x + 1;
                let panel = Panel(number).addChildTo(self.panelGroup)
                    .setPosition(grid.span(x), grid.span(y));
                panel.setCorrectPosition(panel.x, panel.y);
                panel.onpointend = function(){
                    self.movePanel(this); // ピース移動処理
                };
            }
        }
        // ピースをシャッフル
        for(let i = 0;i < 100;i++){
            self.shufflePanels();  
        };
    },
    checkPiecePosition: function() {
        // 全て正しい位置かチェックする
        let res = this.panelGroup.children.every(e=> (e.x == e.correctX) && (e.y == e.correctY));
        if(res){
            this.exit({
                score: 100,
            });
        }
    },
    getBlank: function(){
        let res = null;
        this.panelGroup.children.some(e => {
            if (e.num == N*N){
                res = e;
                return true;
            }
        });
        return res;
    },
    movePanel: function(panel, isInstantly=false){
        // 空白ピースを得る
        let blank = this.getBlank();
        // x, yの座標差の絶対値
        let dx = Math.abs(panel.x - blank.x);
        let dy = Math.abs(panel.y - blank.y);
        // 即入れ替え
        if(isInstantly){
            // 隣り合わせの判定
            if((panel.x == blank.x && dy == GRID_SIZE) || (panel.y == blank.y && dx == GRID_SIZE)){
                let tmpx = panel.x;
                let tmpy = panel.y;
                panel.setPosition(blank.x, blank.y);
                blank.setPosition(tmpx, tmpy);
            }
            return;
        }
        // thisを避難
        let self = this;
        // 隣り合わせの判定
        if((panel.x == blank.x && dy == GRID_SIZE) || (panel.y == blank.y && dx == GRID_SIZE)){
            // タッチされたピース位置を記憶
            let tmpx = panel.x;
            let tmpy = panel.y;
            // tweenerで移動処理
            panel.tweener.clear()
                .to({
                    x: blank.x,
                    y: blank.y
                }, 200, "easeOutCubic")
                .call(()=>{
                    // 空白ピースをタッチされたパネルの位置へ
                    blank.setPosition(tmpx, tmpy);
                    self.checkPiecePosition();
                });
        }
    },
    // 指定の位置のパネルを返す
    getPanelByXY: function(x, y) {
        let res = null;
        this.panelGroup.children.some(e=>{
            // 指定した座標なら
            if (e.x == x && e.y == y) {
                res = e;
                return true;
            }
        });
        return res;
    },
    // パネルをシャッフルする
    shufflePanels: function(){
        let self = this;
        // 隣接パネル格納用
        let panels = [];
        // 空白パネルを得る
        let blank = this.getBlank();
        // 上下左右隣りのパネルがあれば配列に追加
        [1, 0, -1].forEach(i=>{
            [1, 0, -1].forEach(j=>{
                if(i != j){
                    let x = blank.x + i * GRID_SIZE;
                    let y = blank.y + j * GRID_SIZE;
                    let target = self.getPanelByXY(x, y);
                    if(target) panels.push(target);
                }
            });
        });
        // 隣接ピースからランダムに選択して空白ピースと入れ替える
        this.movePanel(panels.random(), true);
        panels.length = 0;
    },
});

// パネルクラス
phina.define("Panel", {
    superClass: "RectangleShape",
    init: function(num){
        // 親クラス初期化
        this.superInit({
            width: PANEL_SIZE,
            height: PANEL_SIZE,
            cornerRadius: 10,
            fill: "silver",
            stroke: "white",
        });
        // 数字
        this.num = num;
        // 正解の位置
        this.correctX = null;
        this.correctY = null;
        // タッチを有効にする
        this.setInteractive(true);
        // 数字表示用ラベル
        this.label = Label({
            text: this.num + "",
            fontSize: PANEL_SIZE * 0.8,
            fill: "white",
        }).addChildTo(this);
        if (this.num == N*N) {
            this.hide();
        }
    },
    setCorrectPosition: function(x, y){
        this.correctX = x;
        this.correctY = y;
    }
});

//resultScene クラスを定義
phina.define("ResultScene", {
    superClass: "DisplayScene",
    init: function(param){
        this.superInit(param);
        Label({
            text: param.score + "点！　お前マジで偉い！",
            fontSize: 50,
            fill: "white",
        }).addChildTo(this).setPosition(320, 240);
  
        this.restartButton = RestartButton().addChildTo(this).setPosition(320,800);
        this.restartButton.onpointend = ()=>this.exit();
    },
  });
  
// RestartButtoクラスを定義
phina.define("RestartButton", {
    superClass: "Button",
    init: function(){
        this.superInit({
            width: 300, // 横サイズ
            height: 155, // 縦サイズ
            text: "restart",  // 表示文字
            fontSize: 70, // 文字サイズ
            fontColor: "black", // 文字色
            cornerRadius: 5,  // 角丸み
            fill: "white", // ボタン色
            stroke: "black",  // 枠色
            strokeWidth: 5,   // 枠太さ
        });
    },
});

// メイン処理
phina.main(function () {
    // アプリケーション生成
    const app = GameApp({
        title: "15パズル",
        startLabel: location.search.substr(1).toObject().scene || "title",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: "gray"
    });
    // アプリケーション実行
    app.run();
});