
import CommentsPlugin from "../main";

/**
 * Регистрация пост-процессора для рендеринга тегов комментариев в режиме чтения
 */

export function registerReadingMode(plugin: CommentsPlugin) {
    plugin.registerMarkdownPostProcessor((element, context) => {

        //элементы, где может находиться текст
        const paragraphs = element.querySelectorAll("p, li, span, h1, h2, h3");

        paragraphs.forEach(p => {

            // обрабатываем только элементы, содержащие тег комментария
            if (p.textContent && p.textContent.includes("#comment:")) {

                const tagRegex = /\[<a[^>]*>#comment<\/a>:([0-9]+)\]/g;
                let html = p.innerHTML

                //замена сырого текста на тег
                p.innerHTML = html.replace(tagRegex, '<a class="comment-tag" id="$1">^^$1</a>');

                const elemTags = p.querySelectorAll('.comment-tag')

                elemTags.forEach(t => {
                    t.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const id = t.getAttribute('id');

                        await plugin.activateView(null, id);
                    })
                })

            }

        }


        )
    })
}