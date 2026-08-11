# 古辞書ビューワー

`古辞書.csv` をもとに、国立国会図書館デジタルコレクションの画像を IIIF Image API と OpenSeadragon で閲覧する静的 Web アプリである。

## ローカル実行

```powershell
python -m http.server 8000
```

ブラウザーで `http://localhost:8000/` を開く。画像、OpenSeadragon本体、IIIFのタイル取得にはインターネット接続が必要である。

## データ形式

CSVの列は `URL,辞書名,巻,頁,面` とする。現在はブラウザーで確実に利用できるよう、CSVから生成済みの `data-v3.js` を読み込む。CSVを更新した場合は同ファイルも再生成する必要がある。

NDLの `https://dl.ndl.go.jp/info:ndljp/pid/{PID}/{コマ}` を、`https://www.dl.ndl.go.jp/api/iiif/{PID}/R{7桁のコマ}/info.json` に変換して表示する。

## 出典とデータ

- 画像出典：国立国会図書館デジタルコレクション
- 辞書位置データ：本プロジェクトで作成した `古辞書.csv`

本アプリは画像ファイルを再配布せず、国立国会図書館が公開する IIIF API から取得して表示する。各資料の利用にあたっては、国立国会図書館デジタルコレクションに表示される公開範囲と利用条件を確認すること。

## ライセンス

本プロジェクトのコードと自作データは [MIT License](LICENSE) で公開する。

画像ビューワーには [OpenSeadragon](https://openseadragon.github.io/) を使用している。OpenSeadragon は New BSD License で提供されている。
