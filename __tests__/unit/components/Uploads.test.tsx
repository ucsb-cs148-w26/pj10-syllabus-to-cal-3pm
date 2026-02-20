import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Uploads } from "../../../components/figma-app/components/features/Uploads";
import { describe, test, expect, beforeEach } from "@jest/globals"

function mockLocalStorage() {
	let store: Record<string, string> = {};

	jest.spyOn(window.localStorage.__proto__, "getItem").mockImplementation((key: string) => {
		return store[key] ?? null;
	});

	jest.spyOn(window.localStorage.__proto__, "setItem").mockImplementation((key: string, value: string) => {
		store[key] = value;
	});

	jest.spyOn(window.localStorage.__proto__, "removeItem").mockImplementation((key: string) => {
		delete store[key];
	});

	return {
		getStore: () => store,
		clear: () => (store = {}),
	};
}

describe("File Uploader Unit Tests", () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	test("Render upload page default view", () => {
		mockLocalStorage();

		render(<Uploads />);

		expect(screen.getByText("Upload Your Syllabuses")).toBeInTheDocument();
		expect(screen.getByText("Upload your first syllabus")).toBeInTheDocument();
	});

	test("Seed mock documents if local storage is empty", async () => {
		const ls = mockLocalStorage();

		render(<Uploads />);

		await userEvent.click(screen.getByRole("button", { name: /documents/i }));

		expect(screen.getByText("CS-101-Syllabus.pdf")).toBeInTheDocument();
		expect(screen.getByText("MATH-201-Syllabus.pdf")).toBeInTheDocument();
		expect(screen.getByText("ENG-150-Syllabus.pdf")).toBeInTheDocument();

		const store = ls.getStore();
		expect(store["syllabusDocuments"]).toBeTruthy();
	});

	test("Load documents from localStorage when present", async () => {
		const ls = mockLocalStorage();

		const savedDocs = [
		{ id: "123", name: "BIO-110.pdf", uploadDate: "2026-01-01", courseName: "BIO 110" },
		];

		window.localStorage.setItem("syllabusDocuments", JSON.stringify(savedDocs));

		render(<Uploads />);

		await userEvent.click(screen.getByRole("button", { name: /documents/i }));

		expect(screen.getByText("BIO-110.pdf")).toBeInTheDocument();
		expect(screen.getByText("BIO 110")).toBeInTheDocument();
	});

	test("Uploading PDF adds it to file list & saves to localStorage", async () => {
		const ls = mockLocalStorage();

		render(<Uploads />);

		await userEvent.click(screen.getByRole("button", { name: /documents/i }));

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		expect(fileInput).toBeTruthy();

		const file = new File(["fake pdf"], "PHYS-220-Syllabus.pdf", { type: "application/pdf" });

		fireEvent.change(fileInput, { target: { files: [file] } });

		expect(await screen.findByText("PHYS-220-Syllabus.pdf")).toBeInTheDocument();

		const saved = JSON.parse(ls.getStore()["syllabusDocuments"]);
		const names = saved.map((d: any) => d.name);
		expect(names).toContain("PHYS-220-Syllabus.pdf");
	});

	test("Deleting document removes it from user view and localStorage", async () => {
		const ls = mockLocalStorage();

		const savedDocs = [
		{ id: "1", name: "TRASH-SYLLABUS.pdf", uploadDate: "2026-01-04", courseName: "TRASH SYLLABUS" },
		{ id: "2", name: "KEEP-SYLLABUS.pdf", uploadDate: "2026-01-01", courseName: "KEEP SYLLABUS" },
		];

		window.localStorage.setItem("syllabusDocuments", JSON.stringify(savedDocs));

		render(<Uploads />);

		await userEvent.click(screen.getByRole("button", { name: /documents/i }));

		expect(screen.getByText("TRASH-SYLLABUS.pdf")).toBeInTheDocument();
		expect(screen.getByText("KEEP-SYLLABUS.pdf")).toBeInTheDocument();

		const row = screen.getByText("TRASH-SYLLABUS.pdf").closest("div")?.parentElement?.parentElement;
		expect(row).toBeTruthy();

		const buttons = screen.getAllByRole("button");
		const trashButton = within(row as HTMLElement).getByRole("button");
		await userEvent.click(trashButton);

		expect(screen.queryByText("TRASH-SYLLABUS.pdf")).not.toBeInTheDocument();
		expect(screen.getByText("KEEP-SYLLABUS.pdf")).toBeInTheDocument();

		const saved = JSON.parse(ls.getStore()["syllabusDocuments"]);
		const names = saved.map((d: any) => d.name);

		expect(names).not.toContain("TRASH-SYLLABUS.pdf");
		expect(names).toContain("KEEP-SYLLABUS.pdf");
	});

	test("Show correct message when all files are deleted", async () => {
		mockLocalStorage();

		const savedDocs = [
			{id: "1", name: "CMPSC-148.pdf", uploadedDate: "2026-02-10", courseName: "CMPSC 148"},
			{id: "2", name: "CMPSC-156.pdf", uploadedDate: "2026-01-08", courseName: "CMPSC 156"},
		];

		window.localStorage.setItem("syllabusDocuments", JSON.stringify(savedDocs));

		render(<Uploads />);

		await userEvent.click(screen.getByRole("button", { name: /documents/i }));

		const trashButtons = screen.getAllByRole("button");

		await userEvent.click(trashButtons[1]);
		await userEvent.click(trashButtons[2]);

		expect(screen.getByText("No documents uploaded yet")).toBeInTheDocument();
	});

	test("Do nothing if upload event had no files", async () => {
		mockLocalStorage();

		render(<Uploads />);

		await userEvent.click(screen.getByRole("button", { name: /documents/i }));

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

		fireEvent.change(fileInput, { target: { files: null }});

		expect(screen.getByText("CS-101-Syllabus.pdf")).toBeInTheDocument();
	});

	test("Do nothing if upload event has empty file list", async () => {
		mockLocalStorage();

		render(<Uploads />);

		await userEvent.click(screen.getByRole("button", { name: /documents/i }));

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

		fireEvent.change(fileInput, { target: { files: [] } });

		expect(screen.getByText("CS-101-Syllabus.pdf")).toBeInTheDocument();
	});
});