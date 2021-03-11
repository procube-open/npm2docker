# npm2docker

npm2docker は node.js 上で動作するプログラムを Docker のイメージにして、dockerhub などのレジストリに登録する開発者向けのツールです。

## 前提条件

- プログラムは npm のレジストリに登録されているおり yarn コマンドでインストールできること
- pacakge.json に bin 属性を持ち、コマンドとして実行できるものであること

## 特長

- Dockerfileは不要です
- npm リポジトリの登録内容からイメージの名前やリビジョンタグを特定し、自動的に付与します
- npm login に対応しています

## 使用方法

### インストール

パーケージに以下のコマンドでインストールしてください。

```
yarn add --dev npm2docker
```

### リリーススクリプト例

packge.json の scripts に以下を追加してください。

```
"register-image": "npx npm2docker パッケージ登録名 --latest --push --remove",
```

npm のプライベートリポジトリに登録されているものに対して使用する場合は
事前に npm login を実行しておく必要があります。その上で以下のように npm_config_registry 環境変数にリポジトリの URLを指定してください。

```
"register-image": "npm_config_registry=https://registry.npmjs.org npx npm2docker パッケージ登録名 --latest --push --remove",
```

リリースする場合、以下のコマンドでリリースしてください。

```
yarn register-image
```

このスクリプトでは、以下を実行します。

1. パッケージ登録名:最終リリースリビジョンをタグとするイメージをビルド
1. dockerhub にイメージを push
1. dockerhub に同じイメージを latest タグを付与して push
1. イメージを削除

ここで、パッケージ登録名にスコープ名が接頭辞として付与されている場合は、
スコープ名を外したものがイメージのタグになります。
最終リビジョンは "docker view パッケージ登録名 version" コマンドで表示されるものです。
イメージの CMD には"docker view パッケージ登録名 bin" コマンドで表示される key-value のうちの最初のものの key値となります。

### プライベートリポジトリへの登録

push する先を --prefix で指定できます。

### dockerhub 上の Organization 内のリポジトリに登録する場合

--prefix で組織名の後に / を追加したものを指定してください。例えば、exorg に登録する場合は、--prefix exorg/ を指定してください。

### 固有レジストリに登録する場合、

--prefix で FQDN:ポート番号の後に / を追加したものを指定してください。例えば、reg.example.com:5000 に登録する場合は、--prefix reg.example.com:5000/ を指定してください。

### その他
その他の利用方法についてはヘルプを参照してください。
```
npx npm2docker --help
```
