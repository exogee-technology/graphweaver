# Graphweaver Contentful

## Exported Methods

### build/buildContentfulSchema

Takes a contenful client config as the first argument (see createClient options at https://github.com/contentful/contentful.js), and a Contentful Content Type ID as the second argument. This reads the schema for the content type from contentful and writes it to `.graphweaver/contentful/{contentTypeId}.schema.json` ready to be read by `createContentfulResolver`, and should be run before graphweaver is started or built.

### createContentfulResolver

Takes a contentful client config as the first argument (see createClient options at https://github.com/contentful/contentful.js), and a Contentful Content Type ID as the second argument. You must have run buildContentfulSchema first with the same configuration to pre-fetch the contentful schema.


## Example

### Build Script 

```
import { buildContentfulSchema } from "@exogee/graphweaver-contentful/build";
import { clientConfig } from "./my-contentful-config";

(async() => {
  await buildContentfulSchema(clientConfig, 'Article');
})();

```

### Graphweaver Backend

```
import { createContentfulResolver } from "@exogee/graphweaver-contentful";

const { 
  resolver: ArticleResolver, 
  entity: ArticleEntity, 
  provider: ArticleProvider
} = createContentfulResolver(clientConfig, 'Article');

```
