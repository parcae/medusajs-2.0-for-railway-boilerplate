import { search } from '@medusajs/framework/utils'
import { defineProductSearchIndex, productSearchSchema } from '@rokmohar/medusa-plugin-meilisearch/indexes'

export default defineProductSearchIndex({
  fields: search.define({
    ...productSearchSchema(),
    // Voeg hier extra/eigen velden toe als je die had in je oude `fields`-array
    // (title, description, variant_sku, thumbnail, handle zitten al standaard in productSearchSchema())
  }),
})