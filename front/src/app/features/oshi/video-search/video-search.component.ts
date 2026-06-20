import { Component } from '@angular/core';

export interface Video {
  id: string; // 動画の一意なID
  title: string; // 動画タイトル
  url: string; // YouTubeなどのURL
  thumbnailUrl: string; // サムネイル画像のURL
  oshiName: string; // 推しグループ名（すとぷり等）
  tags: string[]; // 紐づくタグの配列
  duration: string; // 再生時間（10:24など）
  publishedAt: string; // 公開日
  isSelected?: boolean; // 【フロント専用】編集モードで選択されているかどうかのフラグ
}

@Component({
  selector: 'app-video-search',
  templateUrl: './video-search.component.html',
  styleUrls: ['./video-search.component.css'],
})
export class VideoSearchComponent {
  // モード管理フラグ
  isEditMode = false;

  // 画面に表示する動画のリスト
  videos: Video[] = [];

  constructor() {}

  ngOnInit(): void {
    // 2. 初期化時にダミーデータをセットする（後でここをAPI呼び出しに変えます）
    this.loadDummyVideos();
  }

  // モードを切り替えるメソッド
  toggleMode(mode: 'search' | 'edit') {
    this.isEditMode = mode === 'edit';

    // 検索モードに戻る時は、すべての選択状態をクリアする
    if (!this.isEditMode) {
      this.videos.forEach((v) => (v.isSelected = false));
    }
  }

  // 動画がクリックされた時の処理
  onVideoClick(event: Event, video: Video) {
    if (this.isEditMode) {
      // 編集モードならリンク遷移をキャンセルして、選択状態を反転させる
      event.preventDefault();
      video.isSelected = !video.isSelected;
    }
    // 検索モード（isEditModeがfalse）ならそのままhrefのリンクが開く
  }

  // ※将来APIと繋ぐまでのダミーデータ作成メソッド
  private loadDummyVideos() {
    this.videos = [
      {
        id: '1',
        title: '【神回】最高に盛り上がった伝説のコラボ配信の切り抜き！',
        url: 'https://youtube.com/watch?v=dummy1',
        thumbnailUrl: '', // 空の場合はNO IMAGE表示になる想定
        oshiName: 'すとぷり',
        tags: ['コラボ', 'ゲーム実況'],
        duration: '10:24',
        publishedAt: '2026/06/20',
        isSelected: false,
      },
      {
        id: '2',
        title: '感情を込めて歌ってみた【最高音質】',
        url: 'https://youtube.com/watch?v=dummy2',
        thumbnailUrl: '',
        oshiName: '騎士X',
        tags: ['歌ってみた'],
        duration: '04:15',
        publishedAt: '2026/06/19',
        isSelected: false,
      },
      {
        id: '3',
        title: 'メンバー全員集合！重大発表があります',
        url: 'https://youtube.com/watch?v=dummy3',
        thumbnailUrl: '',
        oshiName: 'AMPTAKxCOLORS',
        tags: ['公式放送', '重大発表'],
        duration: '1:30:00',
        publishedAt: '2026/06/18',
        isSelected: false,
      },
      {
        id: '1',
        title:
          '【神回】最高に盛り上がった伝説のコラボ配信の切り抜き！ああああああああああああ',
        url: 'https://youtube.com/watch?v=dummy1',
        thumbnailUrl: '', // 空の場合はNO IMAGE表示になる想定
        oshiName: 'すとぷり',
        tags: ['コラボ', 'ゲーム実況'],
        duration: '10:24',
        publishedAt: '2026/06/20',
        isSelected: false,
      },
      {
        id: '2',
        title: '感情を込めて歌ってみた【最高音質】',
        url: 'https://youtube.com/watch?v=dummy2',
        thumbnailUrl: '',
        oshiName: '騎士X',
        tags: ['歌ってみた'],
        duration: '04:15',
        publishedAt: '2026/06/19',
        isSelected: false,
      },
      {
        id: '3',
        title: 'メンバー全員集合！重大発表があります',
        url: 'https://youtube.com/watch?v=dummy3',
        thumbnailUrl: '',
        oshiName: 'AMPTAKxCOLORS',
        tags: ['公式放送', '重大発表'],
        duration: '1:30:00',
        publishedAt: '2026/06/18',
        isSelected: false,
      },
      {
        id: '1',
        title: '【神回】最高に盛り上がった伝説のコラボ配信の切り抜き！',
        url: 'https://youtube.com/watch?v=dummy1',
        thumbnailUrl: '', // 空の場合はNO IMAGE表示になる想定
        oshiName: 'すとぷり',
        tags: ['コラボ', 'ゲーム実況'],
        duration: '10:24',
        publishedAt: '2026/06/20',
        isSelected: false,
      },
      {
        id: '2',
        title: '感情を込めて歌ってみた【最高音質】',
        url: 'https://youtube.com/watch?v=dummy2',
        thumbnailUrl: '',
        oshiName: '騎士X',
        tags: ['歌ってみた'],
        duration: '04:15',
        publishedAt: '2026/06/19',
        isSelected: false,
      },
      {
        id: '3',
        title: 'メンバー全員集合！重大発表があります',
        url: 'https://youtube.com/watch?v=dummy3',
        thumbnailUrl: '',
        oshiName: 'AMPTAKxCOLORS',
        tags: ['公式放送', '重大発表'],
        duration: '1:30:00',
        publishedAt: '2026/06/18',
        isSelected: false,
      },
    ];
  }
}
