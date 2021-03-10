# npm2docker

npm2docker は node.js 上で動作するデーモンプログラムを Docker のイメージにして、dockerhub などのレジストリに登録する開発者向けのツールです。

## 前提条件

- デーモンプログラムは npm のレジストリに登録されていること
- npm install --global でインストールするとコマンドとして実行できるものであること

## 特長

- Dockerfileは不要です
- pacakge.json からイメージの名前やタグを特定し、自動的に付与します
- npm login に対応しています