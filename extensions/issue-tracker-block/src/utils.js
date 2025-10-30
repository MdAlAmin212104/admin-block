// @ts-nocheck
/**
 * @param {any} id
 * @param {any} newIssues
 */
export async function updateIssues(id, newIssues) {
  // This example uses metafields to store the data. For more information, refer to https://shopify.dev/docs/apps/custom-data/metafields.
  return await makeGraphQLQuery(
    `mutation SetMetafield($ownerId: ID!, $namespace: String!, $key: String!, $type: String!, $value: String!) {
      metafieldsSet(metafields: [{ownerId: $ownerId, namespace: $namespace, key: $key, type: $type, value: $value}]) {
        metafields {
          id
          namespace
          key
          jsonValue
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      ownerId: id,
      namespace: "$app",
      key: "issues", 
      type: "json",
      value: JSON.stringify(newIssues),
    },
  );
}

/**
 * @param {string} productId
 */
export async function getIssues(productId) {
  // Shopify product metafield fetch করা হচ্ছে
  const res = await makeGraphQLQuery(
    `query Product($id: ID!) {
      product(id: $id) {
        metafield(namespace: "$app", key: "issues") {
          value
        }
      }
    }`,
    { id: productId },
  );

  // যদি metafield value থাকে
  if (res?.data?.product?.metafield?.value) {
    const issues = JSON.parse(res.data.product.metafield.value);

    // যদি প্রতিটি issue-তে id বা createdAt থাকে তাহলে descending order করা
    const sortedIssues = issues.sort((a, b) => {
      // যদি createdAt field থাকে, তাহলে তারিখ অনুযায়ী sort করো
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // না থাকলে id অনুযায়ী sort করো
      return b.id - a.id;
    });

    return sortedIssues;
  }

  return [];
}

/**
 * @param {string} query
 * @param {{ ownerId?: any; namespace?: string; key?: string; type?: string; value?: string; id?: any; }} variables
 */
async function makeGraphQLQuery(query, variables) {
  const graphQLQuery = {
    query,
    variables,
  };

  const res = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify(graphQLQuery),
  });

  if (!res.ok) {
    console.error("Network error");
  }

  return await res.json();
}