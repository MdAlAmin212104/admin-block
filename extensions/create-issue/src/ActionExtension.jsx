// @ts-nocheck
import { render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { getIssues, updateIssues } from "./utils";

export default async () => {
  render(<Extension />, document.body);
};

function generateId(allIssues) {
  return !allIssues?.length ? 0 : allIssues[allIssues.length - 1].id + 1;
}

function validateForm({ title, description }) {
  return {
    isValid: Boolean(title) && Boolean(description),
    errors: {
      title: !title,
      description: !description,
    },
  };
}

function Extension() {
  const { close, data, intents, i18n } = shopify;
  const issueId = intents?.launchUrl
    ? new URL(intents?.launchUrl)?.searchParams?.get("issueId")
    : null;
  const [loading, setLoading] = useState(issueId ? true : false);

  const [issue, setIssue] = useState({
    title: "",
    description: "",
    id: issueId,
  });
  const [allIssues, setAllIssues] = useState([]);
  const [formErrors, setFormErrors] = useState(null);
  const { title, description } = issue;
  const isEditing = Boolean(issueId);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  useEffect(() => {
    getIssues(data.selected[0].id).then((issues) => {
      setLoading(false);
      setAllIssues(issues || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIssueRecommendation = useCallback(async () => {
    // Get a recommended issue title and description from your app's backend
    setLoadingRecommended(true);
    // fetch is automatically authenticated and the path is resolved against your app's URL
    const res = await fetch(
      `api/recommendedProductIssue?productId=${data.selected[0].id}`,
    );
    setLoadingRecommended(false);

    if (!res.ok) {
      console.error("Network error");
    }
    const json = await res.json();
    console.log({ json });
    if (json?.productIssue) {
      // If you get an recommendation, then update the title and description fields
      setIssue(json?.productIssue);
    }
  }, [data.selected]);

  useEffect(() => {
    if (issueId) {
      // If opened from the block extension, find the issue that's being edited
      const editingIssue = allIssues.find(({ id }) => `${id}` === issueId);
      if (editingIssue) {
        // Set the issue's ID in the state
        setIssue(editingIssue);
      }
    }
  }, [issueId, allIssues]);

  const onSubmit = useCallback(async () => {
    const { isValid, errors } = validateForm(issue);
    setFormErrors(errors);
    console.log("submit button click", allIssues);

    if (isValid) {
      const newIssues = [...allIssues];
      
      if (isEditing) {
        // Find the index of the issue that you're editing
        const editingIssueIndex = newIssues.findIndex(
          (listIssue) => listIssue.id == issue.id,
        );
        // Overwrite that issue's title and description with the new ones
        newIssues[editingIssueIndex] = {
          ...issue,
          title,
          description,
        };
      } else {
        // Add a new issue at the end of the list
        newIssues.push({
          id: generateId(allIssues),
          title,
          description,
          completed: false,
        });
      }

      // Commit changes to the database
      await updateIssues(data.selected[0].id, newIssues);
      // Close the modal using the 'close' API
      close();
    }
  }, [issue, data.selected, allIssues, close, isEditing, title, description]);

  if (loading) {
    return <></>;
  }

  return (
    <s-admin-action
      heading={
        isEditing
          ? i18n.translate("edit-issue-heading")
          : i18n.translate("create-issue-heading")
      }
    >
      <s-button slot="primary-action" onClick={onSubmit}>
        {isEditing
          ? "Save"
          : "Create"}
      </s-button>
      <s-button slot="secondary-actions" onClick={() => close()}>
        Cancel
      </s-button>

      {/*Create a banner to let the buyer auto fill the issue with the
      recommendation from the backend*/}

      <s-stack direction="block">
        <s-banner>
          <s-stack direction="block">
            <s-text>{i18n.translate("issue-generate-banner-text")}</s-text>
            <s-stack direction="inline">
              <s-button
                disabled={loadingRecommended}
                onClick={getIssueRecommendation}
              >
                {i18n.translate("issue-generate-button")}
              </s-button>
              {loadingRecommended && <s-spinner />}
            </s-stack>
          </s-stack>
        </s-banner>
      </s-stack>


      <s-text-field
        value={title}
        error={
          formErrors?.title ? i18n.translate("issue-title-error") : undefined
        }
        onChange={(event) =>
          setIssue((prev) => ({ ...prev, title: event.target.value }))
        }
        label={i18n.translate("issue-title-label")}
        maxLength={50}
      />
      <s-box padding-block-start="large">
        <s-text-area
          value={description}
          error={
            formErrors?.description
              ? i18n.translate("issue-description-error")
              : undefined
          }
          onChange={(event) =>
            setIssue((prev) => ({ ...prev, description: event.target.value }))
          }
          label={i18n.translate("issue-description-label")}
          max-length={300}
        />
      </s-box>
    </s-admin-action>
  );
}