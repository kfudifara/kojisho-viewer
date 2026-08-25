# 古辞書ビューワー

`古辞書.csv` をもとに、国立国会図書館デジタルコレクションの画像を IIIF Image API と OpenSeadragon で閲覧する静的 Web アプリである。

本アプリは個人が制作したものであり、国立国会図書館の公式サービスではない。

## ローカル実行

```powershell
python -m http.server 8000
```

ブラウザーで `http://localhost:8000/` を開く。画像、OpenSeadragon本体、IIIFのタイル取得にはインターネット接続が必要である。

## 個別コマのURL

表示中のコマには `#/pid/{PID}/1/{コマ番号}` 形式のURLが自動的に付与される。たとえば、PID `2586891` の6コマ目は次のURLで直接開ける。

`https://kfudifara.github.io/kojisho-viewer/#/pid/2586891/1/6`

登録資料のCSVに所在が記載されていないコマも表示できる。PID自体が登録されていない場合は画像を開かず、その旨を画面に表示する。

## データ形式

CSVの列は `URL,辞書名,巻,頁,面` とする。GitHub Pagesへの公開時に、`古辞書.csv`から`data-v3.js`を自動生成する。CSVを更新してGitHubへプッシュすれば、追加・修正したデータが公開版へ反映される。

ローカル用の`data-v3.js`を更新する場合は、次を実行する。

```powershell
node scripts/generate-data.mjs 古辞書.csv data-v3.js
```

NDLの `https://dl.ndl.go.jp/info:ndljp/pid/{PID}/{コマ}` を、`https://www.dl.ndl.go.jp/api/iiif/{PID}/R{7桁のコマ}/info.json` に変換して表示する。

## 出典とデータ

- 画像出典：国立国会図書館デジタルコレクション
- 辞書位置データ：本プロジェクトで作成した `古辞書.csv`

本アプリは画像ファイルを再配布せず、国立国会図書館が公開する IIIF API から取得して表示する。各資料の利用にあたっては、国立国会図書館デジタルコレクションに表示される公開範囲と利用条件を確認すること。

GitHub Pagesでは、ワークフローがCSVを変換し、実行用ファイルだけを一時ディレクトリへまとめて公開する。

## ライセンス

本プロジェクトのコードと自作データは [MIT License](LICENSE) で公開する。

画像ビューワーには [OpenSeadragon](https://openseadragon.github.io/) を使用している。OpenSeadragon はNew BSD Licenseで提供されている。著作権表示とライセンス条件は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) に記載する。
