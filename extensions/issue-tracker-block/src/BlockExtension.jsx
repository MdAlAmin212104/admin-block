import { render } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { updateIssues, getIssues } from "./utils";

const PAGE_SIZE = 3;

function Extension() {
  const { data, navigation, i18n } = shopify;

  const [loading, setLoading] = useState(true);
  const [, setInitialValues] = useState([]);
  const [issues, setIssues] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const productId = data.selected?.[0]?.id;
  const issuesCount = issues.length;
  const totalPages = Math.ceil(issuesCount / PAGE_SIZE);

  // console.log({ data, productId, totalPages, issuesCount });

  useEffect(() => {
    (async function fetchProductIssues() {
      try {
        // console.log("Fetching metafield data for product:", productId);
        const parsedIssues = await getIssues(productId);

        setLoading(false);

        if (parsedIssues && Array.isArray(parsedIssues)) {
          // console.log("✅ Product metafield issues found:", parsedIssues);
          setInitialValues(
            parsedIssues.map(({ completed }) => Boolean(completed)),
          );
          setIssues(parsedIssues);
        } else {
          console.log("⚠️ No metafield issues found for this product.");
        }
      } catch (error) {
        console.error("❌ Error fetching product issues:", error);
        setLoading(false);
      }
    })();
  }, [productId]);

  const paginatedIssues = useMemo(() => {
    if (issuesCount <= PAGE_SIZE) {
      return issues;
    }

    return [...issues].slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
  }, [issuesCount, issues, currentPage]);


  const handleChange = async (id, value) => {
    setIssues((currentIssues) => {
      const newIssues = [...currentIssues];
      const editingIssueIndex = newIssues.findIndex(
        (listIssue) => listIssue.id == id,
      );
      newIssues[editingIssueIndex] = {
        ...newIssues[editingIssueIndex],
        completed: value === "completed" ? true : false,
      };
      return newIssues;
    });
  };

  const handleDelete = async (id) => {
    const newIssues = issues.filter((issue) => issue.id !== id);
    setIssues(newIssues);
    await updateIssues(productId, newIssues);
  };

  const onSubmit = (event) => {
    event.waitUntil(updateIssues(productId, issues));
  };

  const onReset = () => { };

  if (loading) {
    return (
      <s-stack direction="inline">
        <s-spinner />
      </s-stack>
    );
  }

  // // Show if no issues found
  // if (!loading && issues.length === 0) {
  //   return (
  //     <s-admin-block heading={i18n.translate("name")}>
  //       <s-stack direction="block">
  //         <s-text dir="ltr">No issues found for this product.</s-text>
  //       </s-stack>
  //     </s-admin-block>
  //   );
  // }

  return (
    <s-admin-block heading={i18n.translate("name")}>
      <s-form id={`issues-form`} onSubmit={onSubmit} onReset={onReset}>
        {issues.length ? (
          <>
            <s-table
              id="issues-table"
              paginate={issues.length > 3}  /* ✅ Only paginate if more than 3 */
              onNextPage={() => setCurrentPage(currentPage + 1)}
              onPreviousPage={() => setCurrentPage(currentPage - 1)}
              hasNextPage={currentPage < totalPages}
              hasPreviousPage={currentPage > 1}
            >
              <s-table-header-row>
                <s-table-header listSlot="primary">
                  {i18n.translate("issue-column-heading")}
                </s-table-header>
                <s-table-header>
                  {i18n.translate("status-column-heading")}
                </s-table-header>
                <s-table-header></s-table-header>
                <s-table-header></s-table-header>
              </s-table-header-row>
              <s-table-body>
                {paginatedIssues.map(
                  ({ id, title, description, completed }) => {
                    return (
                      <s-table-row key={id}>
                        <s-table-cell>
                          <s-stack direction="block">
                            <s-text type="strong">{title}</s-text>
                            <s-text>{description}</s-text>
                          </s-stack>
                        </s-table-cell>
                        <s-table-cell>
                          <s-select
                            labelAccessibilityVisibility="exclusive"
                            label={i18n.translate("select-label")}
                            value={completed ? "completed" : "todo"}
                            onChange={(value) => handleChange(id, value)}
                          >
                            <s-option value="todo">
                              {i18n.translate("option-todo")}
                            </s-option>
                            <s-option value="completed">
                              {i18n.translate("option-completed")}
                            </s-option>
                          </s-select>
                        </s-table-cell>
                        <s-table-cell>
                          <s-button
                            variant="tertiary"
                            icon="edit"
                            accessibilityLabel={i18n.translate(
                              "edit-issue-button",
                            )}
                            onClick={() => {
                              const url = `extension:create-issue?issueId=${id}`;
                              navigation?.navigate(url);
                            }}
                          />
                        </s-table-cell>
                        <s-table-cell>
                          <s-button
                            variant="tertiary"
                            icon="delete"
                            accessibilityLabel={i18n.translate(
                              "delete-issue-button",
                            )}
                            onClick={() => handleDelete(id)}
                          />
                        </s-table-cell>
                      </s-table-row>
                    );
                  },
                )}
              </s-table-body>
            </s-table>
            <s-button
              onClick={() => {
                const url = `extension:create-issue`;
                navigation?.navigate(url);
              }}
            >
              {i18n.translate("add-issue-button")}
            </s-button>
          </>)
          :
          (
            <>
              <s-button
                onClick={() => {
                  const url = `extension:create-issue`;
                  navigation?.navigate(url);
                }}
              >
                {i18n.translate("add-issue-button")}
              </s-button>
            </>
          )
        }
      </s-form>
    </s-admin-block>
  );
}

export default async () => {
  render(<Extension />, document.body);
};