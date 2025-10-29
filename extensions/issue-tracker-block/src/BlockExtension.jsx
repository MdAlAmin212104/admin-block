import { render } from "preact";
import { useEffect } from "preact/hooks";
import { getIssues } from "./utils";

export default async () => {
  render(<Extension />, document.body);
};

const PAGE_SIZE = 3;

function Extension() {
  const { i18n, data } = shopify;

  const productId = data.selected?.[0]?.id;

  console.log({ data, productId, totalPages: PAGE_SIZE });

  useEffect(() => {
    (async function fetchProductIssues() {
      try {
        console.log("Fetching metafield data for product:", productId);
        const productData = await getIssues(productId);

        if (productData) {
          console.log("✅ Product metafield issues found:", productData);
        } else {
          console.log("⚠️ No metafield issues found for this product.");
        }
      } catch (error) {
        console.error("❌ Error fetching product issues:", error);
      }
    })();
  }, [productId]);

  return (
    <s-admin-block heading={i18n.translate("name")}>
      <s-stack direction="block">
        <s-text type="strong">Welcome</s-text>
      </s-stack>
    </s-admin-block>
  );
}
