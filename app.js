const labels = [
  { name: "shipping_label_84729.zpl", order: "ORD-84729", format: "ZPL", size: "4.8 KB", added: "Today, 10:45", kind: "Z", type: "type-red" },
  { name: "pallet_label_84726.zpl", order: "ORD-84726", format: "ZPL", size: "12.2 KB", added: "Today, 10:31", kind: "Z", type: "type-blue" },
  { name: "return_label_84718.txt", order: "ORD-84718", format: "TXT", size: "2.1 KB", added: "Today, 10:18", kind: "T", type: "type-green" },
  { name: "shipping_label_84715.zpl", order: "ORD-84715", format: "ZPL", size: "4.6 KB", added: "Today, 09:56", kind: "Z", type: "type-red" },
  { name: "pallet_label_84703.zpl", order: "ORD-84703", format: "ZPL", size: "11.9 KB", added: "Today, 09:42", kind: "Z", type: "type-blue" },
  { name: "shipping_label_84698.zpl", order: "ORD-84698", format: "ZPL", size: "4.5 KB", added: "Today, 09:27", kind: "Z", type: "type-red" }
];

const messages = [
  { time: "10:48:32.184", type: "LABEL_PRINT", ref: "ORD-84729 · shipping_label_84729.zpl", direction: "Bridge → Printer", response: "200 · Printed", status: "success" },
  { time: "10:48:31.927", type: "HOST_ORDER", ref: "ORD-84729 · request_id 7fa2c1", direction: "Host → Bridge", response: "202 · Accepted", status: "success" },
  { time: "10:46:05.411", type: "REQ_LABEL", ref: "PLC request · Line 04", direction: "PLC → Bridge", response: "200 · Acknowledged", status: "success" },
  { time: "10:45:59.208", type: "LABEL_READY", ref: "ORD-84729 · shipping_label_84729.zpl", direction: "Host → Bridge", response: "200 · Stored", status: "success" },
  { time: "10:42:18.092", type: "REQ_LABEL", ref: "ORD-84702 · FILE_MISSING", direction: "PLC → Bridge", response: "404 · Label not found", status: "error" },
  { time: "10:42:18.089", type: "LABEL_LOOKUP", ref: "ORD-84702 · shipping_label_84702.zpl", direction: "Bridge → Store", response: "404 · No matching file", status: "error" },
  { time: "10:38:44.640", type: "HOST_ORDER", ref: "ORD-84726 · request_id 9be510", direction: "Host → Bridge", response: "202 · Accepted", status: "success" },
  { time: "10:38:44.602", type: "LABEL_READY", ref: "ORD-84726 · pallet_label_84726.zpl", direction: "Host → Bridge", response: "200 · Stored", status: "success" }
];
let successfulToday = 12484;
let errorsToday = 2;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pad = (number) => String(number).padStart(2, "0");

function renderLabels() {
  const tbody = $("#full-label-table");
  tbody.innerHTML = labels.map((label) => `
    <tr>
      <td><span class="file-type ${label.type}">${label.kind}</span><span class="file-name">${label.name}</span></td>
      <td class="order-id">${label.order}</td><td><span class="format-pill ${label.format === "TXT" ? "format-txt" : ""}">${label.format}</span></td>
      <td>${label.size}</td><td>${label.added}</td><td><span class="status-pill ready"><i></i> Ready</span></td>
      <td><button class="print-button" data-print="${label.name}">Print <span>↗</span></button></td>
    </tr>`).join("");
  const count = labels.length;
  $("#metric-queue").innerHTML = `${pad(count)} <span class="metric-trend neutral">ready to print</span>`;
  $("#label-ready-count").textContent = pad(count);
  $("#nav-queue-count").textContent = pad(count);
  $("#full-queue-count").textContent = `${count} files`;
  $("#full-showing-count").textContent = count;
  $("#label-search").dispatchEvent(new Event("input"));
  bindPrintButtons();
}

function renderMessages() {
  const tbody = $("#message-table-body");
  tbody.innerHTML = messages.map((message) => {
    const failed = message.status === "error";
    const kindClass = failed ? "kind-amber" : message.type.includes("LABEL") ? "kind-green" : "";
    return `<tr class="${failed ? "error-row" : ""}">
      <td>${message.time}</td>
      <td><span class="message-kind"><i class="kind-dot ${kindClass}"></i>${message.type}</span></td>
      <td><span class="message-title">${message.ref.split(" · ")[0]}</span><span class="message-reference">${message.ref.includes(" · ") ? message.ref.split(" · ").slice(1).join(" · ") : ""}</span></td>
      <td class="direction">${message.direction}</td><td class="response-code">${message.response}</td>
      <td><span class="status-pill ${failed ? "failed" : "ready"}"><i></i>${failed ? "Error" : "Success"}</span></td>
    </tr>`;
  }).join("");
  $("#message-count").textContent = `${messages.length} events`;
  $("#message-total-count").textContent = messages.length;
  $("#failed-message-count").textContent = pad(errorsToday);
  $("#summary-error-count").textContent = errorsToday;
  $("#success-message-count").textContent = successfulToday.toLocaleString("en-US");
  $("#messages-today-count").textContent = (successfulToday + errorsToday).toLocaleString("en-US");
  const latestFailure = messages.find((message) => message.status === "error");
  if (latestFailure) $("#last-failure-time").textContent = latestFailure.time.slice(0, 8);
  $("#message-search").dispatchEvent(new Event("input"));
}

function printLabel(file) {
  const index = labels.findIndex((label) => label.name === file);
  if (index < 0) return;
  const [label] = labels.splice(index, 1);
  const now = new Date();
  messages.unshift({ time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.000`, type: "LABEL_PRINT", ref: `${label.order} · ${label.name}`, direction: "Bridge → Printer", response: "200 · Printed", status: "success" });
  successfulToday++;
  renderLabels();
  renderMessages();
  $("#printed-today-count").textContent = String(Number($("#printed-today-count").textContent) + 1);
  updateActivity("Label printed successfully", `${label.order} · ${label.name}`);
  toast(`${label.name} sent to printer`);
}

function bindPrintButtons() {
  $$("[data-print]", $("#full-label-table")).forEach((button) => {
    button.onclick = () => printLabel(button.dataset.print);
  });
}

function showPage(name) {
  $$(".page-view").forEach((page) => page.classList.toggle("active", page.id === `page-${name}`));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === name));
  const titles = { overview: "Overview", labels: "Label queue", activity: "Recent activity", messages: "Message log" };
  $("#crumb-current").textContent = titles[name] ?? "Overview";
}

function toast(message, isError = false) {
  const element = document.createElement("div");
  element.className = `toast${isError ? " error-toast" : ""}`;
  element.innerHTML = `<i></i><span></span>`;
  $("span", element).textContent = message;
  $("#toast-region").append(element);
  window.setTimeout(() => element.remove(), 3600);
}

function updateActivity(title, detail, isError = false) {
  const item = document.createElement("div");
  item.className = `activity-item${isError ? " activity-error" : ""}`;
  const icon = isError
    ? '<span class="activity-icon error"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 5v5m0 3h.01"/><circle cx="10" cy="10" r="7"/></svg></span>'
    : '<span class="activity-icon success"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg></span>';
  const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
  item.innerHTML = `${icon}<span class="activity-content"><strong></strong><span></span></span><span class="activity-time">${time}</span>`;
  $(".activity-content strong", item).textContent = title;
  $(".activity-content span", item).textContent = detail;
  $("#activity-list").prepend(item);
  while ($("#activity-list").children.length > 20) $("#activity-list").lastElementChild.remove();
}

function filterLabels() {
  const query = $("#label-search").value.trim().toLowerCase();
  const rows = $$("#full-label-table tr");
  let visible = 0;
  rows.forEach((row) => {
    const match = row.textContent.toLowerCase().includes(query);
    row.hidden = !match;
    if (match) visible++;
  });
  $("#labels-empty").hidden = visible !== 0;
  $("#full-showing-count").textContent = visible;
}

function filterMessages() {
  const query = $("#message-search").value.trim().toLowerCase();
  const status = $("#message-filter").value;
  let visible = 0;
  $$("#message-table-body tr").forEach((row, index) => {
    const message = messages[index];
    const matches = row.textContent.toLowerCase().includes(query) && (status === "all" || message.status === status);
    row.hidden = !matches;
    if (matches) visible++;
  });
  $("#messages-empty").hidden = visible !== 0;
  $("#message-showing-count").textContent = visible;
}

function addLabel(file) {
  if (!/\.(zpl|txt|prn)$/i.test(file.name)) {
    toast(`${file.name}: use a .zpl, .txt, or .prn label file`, true);
    return;
  }
  const fileName = file.name.replace(/[<>"]/g, "");
  if (labels.some((label) => label.name === fileName)) {
    toast(`${fileName} is already in the queue`, true);
    return;
  }
  const format = fileName.split(".").pop().toUpperCase();
  const order = `ORD-${String(Date.now()).slice(-5)}`;
  labels.unshift({ name: fileName, order, format, size: `${(file.size / 1024).toFixed(1)} KB`, added: "Just now", kind: format === "TXT" ? "T" : format[0], type: format === "TXT" ? "type-green" : format === "ZPL" ? "type-red" : "type-blue" });
  messages.unshift({ time: `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}.000`, type: "LABEL_READY", ref: `${order} · ${fileName}`, direction: "Host → Bridge", response: "200 · Stored", status: "success" });
  successfulToday++;
  renderLabels();
  renderMessages();
  updateActivity("Label file added to queue", `${order} · ${fileName}`);
  toast(`${fileName} is ready for a PLC request`);
}

$$(".nav-item").forEach((item) => item.addEventListener("click", () => showPage(item.dataset.page)));
$$("[data-goto]").forEach((item) => item.addEventListener("click", () => showPage(item.dataset.goto)));
$("#upload-trigger-page").addEventListener("click", () => $("#file-input").click());
$("#file-input").addEventListener("change", (event) => {
  [...event.target.files].forEach(addLabel);
  event.target.value = "";
});
$("#label-search").addEventListener("input", filterLabels);
$("#label-status-filter").addEventListener("change", filterLabels);
$("#message-search").addEventListener("input", filterMessages);
$("#message-filter").addEventListener("change", filterMessages);
$("#refresh-button").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Refreshing…";
  window.setTimeout(() => {
    button.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 8a6 6 0 0 0-10-3L4 7m0 0V3m0 4h4m-4 5a6 6 0 0 0 10 3l2-2m0 0v4m0-4h-4"/></svg>Refresh';
    button.disabled = false;
    $(".updated").innerHTML = '<span class="refresh-icon">↻</span> Updated just now';
    toast("Connection status refreshed");
  }, 650);
});
$("#simulate-request").addEventListener("click", () => {
  const label = labels.shift();
  const now = new Date();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.000`;
  if (label) {
    messages.unshift({ time, type: "REQ_LABEL", ref: `${label.order} · PLC request · Line 04`, direction: "PLC → Bridge", response: "200 · Printed", status: "success" });
    messages.unshift({ time, type: "LABEL_PRINT", ref: `${label.order} · ${label.name}`, direction: "Bridge → Printer", response: "200 · Printed", status: "success" });
    successfulToday += 2;
    renderLabels();
    renderMessages();
    $("#printed-today-count").textContent = String(Number($("#printed-today-count").textContent) + 1);
    updateActivity("PLC requested a label", `${label.order} · ${label.name}`);
    toast(`PLC request fulfilled · ${label.name}`);
  } else {
    messages.unshift({ time, type: "REQ_LABEL", ref: "PLC request · no queued labels", direction: "PLC → Bridge", response: "404 · No label available", status: "error" });
    errorsToday++;
    renderMessages();
    updateActivity("PLC request could not be fulfilled", "No label files are currently queued", true);
    toast("No label files are waiting in the queue", true);
  }
});
$("#export-messages").addEventListener("click", () => {
  const csv = ["Time,Type,Reference,Direction,Response,Status", ...messages.map((message) => [message.time, message.type, message.ref, message.direction, message.response, message.status].map((value) => `"${value.replace(/"/g, '""')}"`).join(","))].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "relay-wcs-message-log.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  toast("Message log exported");
});

renderLabels();
renderMessages();
