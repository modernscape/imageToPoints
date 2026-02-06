import {list} from "./list.js"

window.onload = function () {
  let title = ""

  for (let i = 0; i < list.length; i++) {
    const obj = list[i]
    if (location.href.includes(obj.href)) {
      title = obj.title

      let span = document.createElement("span")
      span.classList.add("title")
      span.innerHTML = title
      document.body.prepend(span)

      const pageTitle = title.replace("<br>", " ")
      document.title = pageTitle

      const links = obj.links

      if (links != undefined) {
        const ary = links.split(",")
        for (let i = 0; i < ary.length; i++) {
          const link = ary[i]
          const str = `<a href="${link}" target="_blank">${link}</a>`
          span.innerHTML += str
        }
      }
      break
    }
  }

  // let span = document.createElement('span');
  // span.classList.add('title');
  // span.textContent = document.title;
  // document.body.prepend(span);

  // <a href="/pages/24-10-13_flowParticles/" target="013" onload="setText()">
  //   パスに沿って連続的に流れるパーティクル
  // </a>;
}

// // 新しい<a>タグが追加された時のコールバック関数
// function onAnchorAdded(anchorElement) {
//   alert(`<a>タグが生成されました: ${anchorElement.href}`);
// }

// // MutationObserverでDOMの変化を監視
// window.onload = function () {
//   const observer = new MutationObserver(function (mutations) {
//     mutations.forEach(function (mutation) {
//       mutation.addedNodes.forEach(function (node) {
//         // 追加された要素が<a>タグかどうかを確認
//         if (node.nodeName.toLowerCase() === 'a') {
//           onAnchorAdded(node); // コールバックを実行
//         }
//       });
//     });
//   });

//   // 監視対象のDOMツリー
//   const config = { childList: true, subtree: true };

//   // body要素を監視対象に設定
//   observer.observe(document.body, config);

//   // 動的に<a>要素を追加するコード
//   setTimeout(function () {
//     const newLink = document.createElement('a');
//     newLink.href = 'https://example.com';
//     newLink.textContent = 'Example Link';
//     document.body.appendChild(newLink);
//   }, 2000); // 2秒後にリンクを追加
// };
