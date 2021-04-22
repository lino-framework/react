import 'quill-mention';

import queryString from 'query-string';
import {fetch as fetchPolyfill} from 'whatwg-fetch';
import regeneratorRuntime from "regenerator-runtime"; // require for async request (in getting mention/tag suggestion)

const atValue = [{ value: "Mention @People" }], hashValue = [{ value: "Tag #content" }];

export function quillMention(signal) {
    function renderItem(item, searchTerm) {
        let value = "";
        if (item){
            if (item.value) {
                value += item.value;
            }
            if (item.title) {
                value += ": " + item.title;
            }
        }
        return value.toLowerCase().split(searchTerm.toLowerCase()).join(
            "<span class='search-match'>" + searchTerm + "</span>"
        )
    }

    function mentionSource(searchTerm, renderList, mentionChar) {
        if (searchTerm.length === 0) {
            let values = mentionChar === "@" ? atValue : hashValue;
            renderList(values, searchTerm);
        } else {
            async function asyncFetch(searchTerm, renderList, mentionChar, signal) {
                let ajax_query = {
                    query: searchTerm,
                    trigger: mentionChar};
                const abortableFetch = ('signal' in new Request('')) ? window.fetch : fetchPolyfill;
                await abortableFetch(`suggestions?${queryString.stringify(ajax_query)}`, {signal: signal}).then(window.App.handleAjaxResponse).then(data => {
                    renderList(data.suggestions, searchTerm);
                }).catch(error => {
                    if (error.name === "AbortError") {
                        console.warn("Request Aborted due to component unmount!");
                    } else {
                        window.App.handleAjaxException(error);
                    }
                });
            }
            asyncFetch(searchTerm, renderList, mentionChar, signal);
        }
    }

    return {
        allowedChars: /^[A-Za-z0-9\s]*$/,
        mentionDenotationChars: window.App.state.site_data.suggestors,
        source: mentionSource,
        renderItem: renderItem,
        listItemClass: "ql-mention-list-item",
        mentionContainerClass: "ql-mention-list-container",
        mentionListClass: "ql-mention-list",
        dataAttributes: ["value", "link", "title", "denotationChar"],
    }
}
