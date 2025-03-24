import { EventRegistry, QueryEvents, QueryArticles, RequestEventsInfo, RequestArticlesInfo, ReturnInfo, ArticleInfoFlags } from "eventregistry";

const er = new EventRegistry({
    apiKey: "844c6df2-0009-4215-afa0-691f7defd8dd"
});

async function searchEvents(searchTopic = "Tesla") {
    try {
        const conceptUri = await er.getConceptUri(searchTopic, {
            lang: "eng"
        });

        const q = new QueryEvents({
            conceptUri: conceptUri,
            lang: ["eng"],
            dataType: ["news"]
        });

        const requestEvents = new RequestEventsInfo({
            page: 1,
            count: 1,
            sortBy: "date"
        });

        q.setRequestedResult(requestEvents);
        const response = await er.execQuery(q);
        
        if (response?.events?.results?.[0]) {
            const event = response.events.results[0];
            console.log(`\nLatest ${searchTopic} Event:`);
            console.log("Title:", event.title.eng);
            console.log("Date:", event.eventDate);
            console.log("Description:", event.summary.eng);

            // Get related articles
            const articleQuery = new QueryArticles({
                lang: ["eng"],
                eventUri: event.uri
            });

            const articlesRequest = new RequestArticlesInfo({
                page: 1,
                count: 3,
                sortBy: "date",
                sortByAsc: false,
                returnInfo: new ReturnInfo({
                    articleInfo: new ArticleInfoFlags({
                        bodyLen: -1,
                        basicInfo: true,
                        title: true,
                        body: true,
                        image: true,
                        source: true
                    })
                })
            });

            articleQuery.setRequestedResult(articlesRequest);
            const articleResponse = await er.execQuery(articleQuery);

            if (articleResponse?.articles?.results) {
                console.log("\nTop Related Articles:");
                articleResponse.articles.results.forEach((article, index) => {
                    console.log(`\nArticle ${index + 1}:`);
                    console.log("Title:", article.title);
                    console.log("Source:", article.source?.uri);
                    if (article.url) console.log("URL:", article.url);
                    if (article.image) console.log("Image:", article.image);
                });
            }
        }

    } catch (error) {
        console.error("Error searching events:", error);
    }
}

searchEvents("Tesla");

export { searchEvents };