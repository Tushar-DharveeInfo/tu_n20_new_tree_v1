
import { useCallback, useEffect, useRef, useState } from 'react'
import { IImage } from '../../allinterface/basic/IImage'
import { Notes } from '@n20a/libavnotes';
import type { INote } from '@n20a/libavnotes';
import { axiosInterceptor } from '../../interceptors/Interceptor';
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks'
import { useSessionContext } from '../../context/hooks/SessionHooks'
import '../../allcss/sidebar//FqaNotes.css'
import '@n20a/libavnotes/style.css'
import { EM, FS, NODE } from '../../interceptors/EndPoints'
import { FilterKeywordControl } from '../../searchfilter/filterkeywordcontrol/FilterKeywordControl';
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate'
import { FnGetSessionVariableFromStorage } from '../../allcommon/basic/FnGetSessionVariableFromStorage'
import { FnHandleAPIResponse } from '../../allcommon/basic/FnHandleAPIResponse'
import { FnConvertBase64Blob } from '../../allcommon/sidebar/FnConvertBase64Blob'
import { IFqaNotes, INoteItems } from '../../allinterface/sidebar/IFqaNotes'
import { YesNoFormContainer } from '../../basic/yesnoformcontainer/YesNoFormContainer'
import { ActionImage } from '../../basic/actionimage/ActionImage'
import { Label } from '../../basic/label/Label'
import { UploadAudio } from './UploadAudio'
import { UploadVideo } from './UploadVideo'
import { InfoMessage } from './InfoMessage'
import { Video } from './Video'
import { Image } from '../../basic/image/Image'
import { Audio } from './Audio'
import { Attach24x24, Delete24x24, Download24x24, Info24x24, Mic24x24, Video24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { FnGetFileCategoryFromFile, FnGetExtensionFromMime } from '../../../appcontainer/allcommon/FnGetFileCategoryFromFile';
import { FnGetApplicationParameter } from '../../allcommon/basic/FnGetApplicationParameter';
import { SettingSubgroups, SettingGroups } from '../../../constants/Feature';
import { SettingApNames } from '../../alldefaultprops/basic/DefaultPropsAppqaSettingsContainer';
import { useMainAppContext } from '../../context/hooks/MainAppHooks';
import { ISession } from '../../context/allinterface/ISession';

const searchProps = {
	uniqueName: "filtericon",
	isShowFilterControl: true, //show filter control.
	lensDirty: false,
	filterDirty: false,
	searchInputValue: "",
};
const FqaNotes = (props: IFqaNotes) => {
	const [selectedItem, setSelectedItem] = useState<any>(null)
	const [deleteItem, setDeleteItem] = useState<any>(null)
	const [showMessage, setShowMessage] = useState<boolean>(false)
	const [uploadButton, setUploadButton] = useState<string>('')
	const [noteDetails, setNoteDetails] = useState<INote>();
	const [isDisableAvNotes, setIsDisableAvNotes] = useState<boolean>(false);
	const [selectedNoteProps, setSelectedNoteProps] = useState<INote>()
	const [searchText, setSearchText] = useState<string>('');
	const [notesItems, setNoteItems] = useState<INoteItems[]>([])
	const [lensDirty, setLensDirty] = useState<boolean>(false)
	const [originalNotesItems, setOriginalNotesItems] = useState<INoteItems[]>([])
	const [searchControlProps, setSearchControlProps] = useState<any>(searchProps);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState("");
	const [showOkButton, setShowOkButton] = useState<boolean>(false);
	const statusBarContext = useStatusBarContext();
	const sessionContext = useSessionContext();
	const mainAppContext = useMainAppContext();
	const notesListRef = useRef<HTMLDivElement | null>(null);
	/* Set while an add is in flight so the refreshed list scrolls to the new note. */
	const scrollToNewNoteRef = useRef<boolean>(false);


	const deleteImage: IImage = {
		uniqueName: `delete-icon`,
		source: <Delete24x24
			size={FnGetCssVariable('--image-size-2')}
			fill='none'
			strokeWidth={1} />,
		w: 'var(--image-size-2)',
		type: "svg",
		tooltip: "Click to Delete"
	}

	useEffect(() => {
		if (props.selectedNode) {
			getNotesDetails()
		}
	}, [props.selectedNode]);

	/* Brings the newly added note into view once the refreshed list has rendered. */
	useEffect(() => {
		if (!scrollToNewNoteRef.current) {
			return;
		}
		scrollToNewNoteRef.current = false;

		const notesList = notesListRef.current;
		if (!notesList) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			notesList.scrollTo({ top: notesList.scrollHeight, behavior: 'smooth' });
		});

		return () => cancelAnimationFrame(frame);
	}, [notesItems]);

	useEffect(() => {
		const avNotesRecord = mainAppContext.apRecords.find(
			(item) => item.Name.toLowerCase() === "avnotes"
		);

		const value = String(avNotesRecord?.Value ?? "").trim().toLowerCase();

		setIsDisableAvNotes(
			value === "true" ||
			value === "1" ||
			value === "yes"
		);
	}, [mainAppContext.apRecords]);



	const getNotesDetails = () => {
		setSelectedItem(null)
		axiosInterceptor({
			url: EM.GetEntityRecords,
			data: {
				entityName: props.selectedNode.NodeEntityname,
				tableName: "PG.Notes",
				entIDs: props.selectedNode.NodeEntID
			},
			setFetchData: (getEntityRecordsApiResponse: unknown, status?: string) => {
				if (status === '200' && getEntityRecordsApiResponse && typeof getEntityRecordsApiResponse === "string") {
					const parsedData = FnHandleAPIResponse(getEntityRecordsApiResponse, "Dataset");
					if (typeof parsedData === "object" && Array.isArray(parsedData[`PG.Notes`])) {
						const notes = parsedData[`PG.Notes`];
						setNoteItems(notes)
						setOriginalNotesItems(notes)
					}
				}
			}
		}, statusBarContext);
	}
	const apiCallForAdd = (payload: Record<string, any>, scrollToNewNote?: boolean) => {
		axiosInterceptor({
			url: EM.AddUpdateTableRecord,
			data: {
				jsonString: JSON.stringify({ 'PG.Notes': [payload] })
			},
			allowShowLoader: true,
			setFetchData: (reponse: unknown, status?: string) => {
				if (status === "200") {
					if (scrollToNewNote) {
						scrollToNewNoteRef.current = true;
					}
					getNotesDetails()
				}
			}
		}, statusBarContext);
	}
	const sendNotes = useCallback(async (message: INote) => {
		try {
			function getFirst10Chars(text: string): string {
				if (!text) return "";
				return text.substring(0, 10);
			}
			let base64String;
			let fileName;
			let fileType: string = "Message";
			let fileObject;
			if (message.notevideo) {
				base64String = await FnConvertBase64Blob(message.notevideo, "toBase64", message.notevideo.type)
				fileName = getFirst10Chars(message.notecontent)
				fileType = "Video"
				fileObject = message.notevideo
			} else if (message.notefile) {
				base64String = await FnConvertBase64Blob(message.notefile, "toBase64", message.notefile.type)
				fileName = message.notefile && (message.notefile as Record<string, any>).name ? (message.notefile as Record<string, any>).name : getFirst10Chars(message.notecontent)

				fileType = "image"
				fileObject = message.notefile
			} else if (message.noteaudio) {
				base64String = await FnConvertBase64Blob(message.noteaudio, "toBase64", message.noteaudio.type)
				fileName = getFirst10Chars(message.notecontent)

				fileType = "Audio"
				fileObject = message.noteaudio
			}
			if (!message.notecontent?.length) {
				setConfirmMessage("Please enter a note before saving. If you attach a file, audio, or video, include a note describing it.");
				setShowOkButton(true);
				setDeleteOpen(true);
				return;
			}
			let LoginUserName: ISession[] | null = FnGetSessionVariableFromStorage("RequestedBy", "LoginShortName", sessionContext.SessionList);
			const userName = LoginUserName && LoginUserName?.length > 0 ? LoginUserName[0].SessionValue : "";
			if (!message.notefile && !message.notevideo && !message.noteaudio) {
				const payload = {
					UserName: userName,
					NotesType: fileType,
					NotesMax: message.notecontent,
					EntID: props.selectedNode.NodeEntID,
					EntityName: props.selectedNode.NodeEntityname,
				}
				apiCallForAdd(payload, true)
			} else {
				await axiosInterceptor({
					url: FS.UploadFileStream,
					data: {
						"fileCategory": FnGetFileCategoryFromFile(fileObject as Blob),
						"fileExtension": FnGetExtensionFromMime(fileObject?.type as string, fileName),
						"fileBlob": base64String,
						"fileName": fileName,
						"prefix": props.selectedNode.NodeEntityname,
						"userName": userName,
						"entID": props.selectedNode.NodeEntID,
						"entityName": props.selectedNode.NodeEntityname
					},
					allowShowLoader: true,
					setFetchData: async (uploadFileStreamResponse: unknown, status?: string) => {
						if (status === '200' && uploadFileStreamResponse && typeof uploadFileStreamResponse === 'object' && 'fileUID' in uploadFileStreamResponse) {

							const payload: any = {
								UserName: userName,
								NotesType: fileType,
								NotesMax: message.notecontent,
								EntID: props.selectedNode.NodeEntID,
								EntityName: props.selectedNode.NodeEntityname,
								fileUID: uploadFileStreamResponse.fileUID,
								noteType: fileType,
							}
							apiCallForAdd(payload, true)
						}


					}
				}, statusBarContext)
				//upload files 

			}
		} catch (error) {
			console.error("Error sending note:", error);
		}
	}, [props.selectedNode, sessionContext.SessionList])
	const getRecordingTimes = async () => {
		try {
			const getConfigValue = (name: string) =>
				FnGetApplicationParameter(
					SettingGroups.AdminConfiguration,
					SettingSubgroups.Configure,
					mainAppContext.apRecords,
					undefined,
					name
				);

			const maxAudioRecordingTimeRes = getConfigValue(
				SettingApNames.maxAudioRecordingTime
			);

			const maxVideoRecordingTimeRes = getConfigValue(
				SettingApNames.maxVideoRecordingTime
			);

			return {
				maxAudioRecordingTime: maxAudioRecordingTimeRes && Number(maxAudioRecordingTimeRes[0]?.Value || 0),
				maxVideoRecordingTime: maxVideoRecordingTimeRes && Number(maxVideoRecordingTimeRes[0]?.Value || 0)
			};

		} catch (error) {
			console.error("Error fetching recording times:", error);
			return {
				maxAudioRecordingTime: 0,
				maxVideoRecordingTime: 0
			};
		}
	};
	useEffect(() => {
		const setNodeDetails = async () => {

			const data = await getRecordingTimes()
			const maxAudioRecordingTime = data.maxAudioRecordingTime && Number(data.maxAudioRecordingTime || 0)
			const maxVideoRecordingTime = data.maxVideoRecordingTime && Number(data.maxVideoRecordingTime || 0)



			setNoteDetails(
				{
					maxAudioRecordingTime: maxAudioRecordingTime * 1000, // milliseconds, load from _ap and set here
					maxVideoRecordingTime: maxVideoRecordingTime * 1000, // milliseconds

					noteId: "1",
					noteTitle: "",
					notecontent: "",
					notefile: undefined,
					noteaudio: undefined,
					notevideo: undefined,
					noteCreatedAt: new Date(),
					sendNote: sendNotes
				});
		}
		setNodeDetails()
	}, [props.selectedNode, sendNotes]);
	const handleDownload = (base64Data: string, fileName: string) => {
		try {
			// Remove potential Base64 headers (e.g., "data:image/svg+xml;base64,")
			const base64HeaderRemoved = base64Data.replace(/^data:image\/svg\+xml;base64,/, "");

			// Decode Base64 to binary
			const byteCharacters = atob(base64HeaderRemoved);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);

			// Create Blob with the correct MIME type (SVG in this case)
			const blob = new Blob([byteArray], { type: "image/svg+xml" });

			// Create Object URL and trigger download
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();

			// Cleanup
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Download failed:", error);
		}
	};


	const getFileTableData = async (EntID: string, EntityName: string) => {
		return new Promise(async (resolve, reject) => {
			await axiosInterceptor(
				{
					url: NODE.GetKebabMenuData,
					data: {
						entID: EntID,
						entityName: EntityName,
						kebabMenuTableName: "PG.FileProfile",
					},
					allowShowLoader: true,
					setFetchData: async (resp: unknown) => {
						try {
							if (
								resp &&
								typeof resp === "object" &&
								"propertyJson" in resp
							) {
								let parsed: Record<string, any>;

								try {
									parsed = JSON.parse(
										(resp as Record<string, any>).propertyJson
									);
								} catch (err) {
									console.error("JSON parse error:", err);
									statusBarContext?.setFetchError?.([
										"Invalid response from kebab menu API.",
									]);
									reject(err);
									return;
								}

								const resultArray =
									parsed?.["PG.FileProfile"] || [];

								resolve(resultArray);
							} else {
								// Invalid response shape
								statusBarContext?.setFetchError?.([
									"Unexpected response structure.",
								]);
								resolve([]); // keep behavior safe
							}
						} catch (err) {
							console.error("KebabMenu data parse error:", err);
							statusBarContext?.setFetchError?.([
								"Invalid response from kebab menu API.",
							]);
							reject(err);
						}
					},
				},
				statusBarContext
			);

		});
	};

	function downloadBase64File(base64String: string, fileName: string, extension: string) {
		try {
			// Convert base64 → byte array
			const byteCharacters = atob(base64String);
			const byteNumbers = new Array(byteCharacters.length);

			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);

			// Create Blob
			const fileBlob = new Blob([byteArray]);

			// Create download link
			const blobUrl = URL.createObjectURL(fileBlob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = `${fileName}.${extension}`;
			document.body.appendChild(link);

			link.click();

			document.body.removeChild(link);
			URL.revokeObjectURL(blobUrl);
		} catch (error) {
			console.error("Download failed:", error);
		}
	}
	function base64ToBlob(base64: string, contentType = ""): Blob {
		try {
			statusBarContext?.setIsLoading?.(true);

			let cleanedBase64 = "";

			try {
				cleanedBase64 = base64?.includes(",")
					? base64.split(",")[1]
					: base64;
			} catch (err) {
				console.error("Base64 cleaning error:", err);
				cleanedBase64 = base64 || "";
			}

			let byteCharacters = "";

			try {
				byteCharacters = atob(cleanedBase64);
			} catch (err) {
				console.error("Base64 decode error:", err);
				statusBarContext?.setIsLoading?.(false);
				return new Blob([], { type: contentType });
			}

			const byteNumbers = new Array(byteCharacters.length);

			try {
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
			} catch (err) {
				console.error("Byte conversion error:", err);
			}

			const byteArray = new Uint8Array(byteNumbers);

			statusBarContext?.setIsLoading?.(false);

			return new Blob([byteArray], { type: contentType });

		} catch (error) {
			console.error("base64ToBlob error:", error);
			statusBarContext?.setIsLoading?.(false);
			return new Blob([], { type: contentType });
		}
	}

	const handleAIClick = async (item: any, iconName: string) => {
		if (iconName !== "Download_24x24.svg") {
			const fileObj = await getFileTableData(item.EntID, item.EntityName)
			const filterFile =
				Array.isArray(fileObj)
					? fileObj.find((file: any) => file.FileUID === item.FileUID)
					: undefined;
			if (filterFile) {

				await axiosInterceptor({
					url: FS.GetFileStream,
					data: {
						"entID": filterFile.EntID,
						"entityName": filterFile.entityName,
						"fileCategory": filterFile.FileCategory,
						"fileName": filterFile.DocName,
						"fileExtension": filterFile.FileExtension,
						"fileUID": filterFile.FileUID
					},
					allowShowLoader: true,
					setFetchData: async (uploadFileStreamResponse: unknown, status?: string) => {
						if (status === "200" && uploadFileStreamResponse &&
							typeof uploadFileStreamResponse === "object" &&
							"fileBlob" in uploadFileStreamResponse) {
							if (filterFile.FileCategory?.toLowerCase() !== "audio" && filterFile.FileCategory?.toLowerCase() !== "video") {

								const nameOnly = filterFile.DocName.split('.').slice(0, -1).join('.');
								downloadBase64File(uploadFileStreamResponse.fileBlob as string, nameOnly, filterFile.FileExtension)
							} else {

								const blob: Blob = base64ToBlob(uploadFileStreamResponse.fileBlob as string, filterFile.FileCategory === "audio" ? "audio" : "video")
								const data = await getRecordingTimes()
								const maxAudioRecordingTime = data.maxAudioRecordingTime && Number(data.maxAudioRecordingTime || 0)
								const maxVideoRecordingTime = data.maxVideoRecordingTime && Number(data.maxVideoRecordingTime || 0)
								if (blob) {
									const note: INote = {
										maxAudioRecordingTime: maxAudioRecordingTime * 1000, // milliseconds, load from _ap and set here
										maxVideoRecordingTime: maxVideoRecordingTime * 1000, // milliseconds
										noteId: filterFile.EntID,
										noteTitle: filterFile.DocName,
										notecontent: filterFile.DocName,
										noteCreatedAt: new Date(),
										noteaudio: filterFile.FileCategory === "audio" ? blob : undefined,
										notevideo: filterFile.FileCategory === "video" ? blob : undefined,
									}

									setSelectedNoteProps(note)
								}
							}
						}

					}
				}, statusBarContext)
			}
			if (item.NotesType?.toLowerCase() !== "image")
				setSelectedItem(item)
		} else {
			handleDownload(item.fileObj.fileData, item.fileObj.fileName)
		}
	}
	const handleSvgFileName = (item: INoteItems) => {
		if (item.NotesType?.toLowerCase() === "image") {
			if (item.fileObj) {
				return {
					icon: <Download24x24 size={FnGetCssVariable('--image-size-1')}
						fill='none'
						strokeWidth={1} />, iconName: "Download_24x24.svg"
				}
			} else {
				return {
					icon: <Attach24x24 size={FnGetCssVariable('--image-size-1')}
						fill='none'
						strokeWidth={1} />, iconName: "Attach_24x24.svg"
				}
			}
		} else if (item.NotesType?.toLowerCase() === "video") {
			return {
				icon: <Video24x24 size={FnGetCssVariable('--image-size-1')}
					fill='none'
					strokeWidth={1} />, iconName: "Video_24x24.svg"
			}
		} else if (item.NotesType?.toLowerCase() === "audio") {
			return {
				icon: <Mic24x24 size={FnGetCssVariable('--image-size-1')}
					fill='none'
					strokeWidth={1} />, iconName: "Mic_24x24.svg"
			}
		} else {
			return {
				icon: <Info24x24 size={FnGetCssVariable('--image-size-1')}
					fill='none'
					strokeWidth={1} />, iconName: "Info_24x24.svg"
			}
		}
	}

	const handleSvgFileTooltip = (item: INoteItems) => {
		if (item.NotesType?.toLowerCase() === "image") {
			return "Download File"
		} else if (item.NotesType?.toLowerCase() === "video") {
			return 'View video'
		} else if (item.NotesType?.toLowerCase() === "audio") {
			return 'View Audio'
		} else {
			return "Info"
		}
	}

	const handleDelete = (item: any) => {
		setShowOkButton(false);
		setConfirmMessage("Are you sure you want to delete this note?");
		setDeleteOpen(true);
		setDeleteItem(item)
	}

	const handleKeywordSearchResult = async (event: MouseEvent) => {

		let filterData: any = [];
		filterData = notesItems.filter((element: any) => {
			return (
				element.NotesMAX?.toLowerCase().includes(searchText?.toLowerCase())
			);
		});

		setNoteItems([...filterData]);

	};
	function searchValueChange(value: string): void {
		setSearchText(value);
		setLensDirty(value.length ? true : false);
		if (!value.length) {
			setNoteItems(originalNotesItems)
		}
	}
	const handleConfirmYesClick = async () => {
		const deleteRecord = () => {
			axiosInterceptor({
				url: EM.DeleteTableRecords,
				data: {
					entityName: deleteItem.EntityName,
					tableName: "PG.Notes",
					entIDs: deleteItem.EntID,
					recIDs: deleteItem.RecID
				},
				setFetchData: (reponse: unknown, status?: string) => {
					if (status === "200")
						getNotesDetails()
				}
			}, statusBarContext);
		}
		if (deleteItem.FileUID) {
			const fileStreamData = await getFileTableData(deleteItem.EntID, deleteItem.EntityName);
			const filterFile =
				Array.isArray(fileStreamData)
					? fileStreamData.find((file: any) => file.FileUID === deleteItem.FileUID)
					: undefined;
			if (filterFile) {
				axiosInterceptor({
					url: FS.DeleteFileStream,
					data: {
						fileUID: deleteItem.FileUID,
						fileCategory: deleteItem.NotesType,
						fileExtension: filterFile.FileExtension
					},
					setFetchData: (reponse: unknown, status?: string) => {
						if (status === "200")
							deleteRecord()
					}
				}, statusBarContext);
			}
			else {
				deleteRecord()
			}
		} else {
			deleteRecord()
		}

		setDeleteOpen(false)
	}
	const handleUpdateData = async (message: INote) => {

		let LoginUserName: ISession[] | null = FnGetSessionVariableFromStorage("RequestedBy", "LoginShortName", sessionContext.SessionList);
		const userName = LoginUserName && LoginUserName?.length > 0 ? LoginUserName[0].SessionValue : "";
		const payload = {
			UserName: userName,
			NotesType: selectedItem.NotesType,
			NotesMax: message.notecontent,
			EntityName: selectedItem.EntityName,
			EntID: selectedItem.EntID,
			RecID: selectedItem.RecID
		}
		apiCallForAdd(payload)
	}
	const handleDeleteNotes = (objectType: 'file' | 'audio' | 'video', objectData?: Blob | File) => {

	}

	return (
		<div className='nz-node-list-Container' key={props.uniqueName}>
			<div className='nz-notes-list-main-div'>
				{uploadButton === "audio" && <UploadAudio handleClose={() => setUploadButton('')} />}
				{uploadButton === "video" && <UploadVideo handleClose={() => setUploadButton('')} />}
				<div className='nz-notes-list-with-msg-box'>
					<div className="nz-sub-header">
						<Label uniqueName='Notes-header' label={`Notes`} />
					</div>
					{!props.hideSearchControl && searchControlProps && (
						<div className="nz-notes-search">
							<FilterKeywordControl
								{...searchControlProps}
								searchInputValue={searchText}
								filterDirty={lensDirty}
								handleFilterMouse={handleKeywordSearchResult}
								searchValueChange={searchValueChange}
								filterIconTooltip='Filter'
							/>
						</div>
					)}
					<div ref={notesListRef} className={selectedItem ? 'nz-notes-only' : 'nz-notes-list-scroll'}>
						{notesItems.map((item, index) => {

							return (
								<div className={'nz-node-list-box'} key={index}>
									<div className='nz-node-list-delete'>
										<ActionImage image={deleteImage} w={'var(--node_height)'} h={'var(--node_height)'}
											uniqueName={`deleteicon`}
											actionCode={'delete'}
											disabled={false}
											handleMouse={() => handleDelete(item)} />
										<div className='nz-note-date'>
											<Label uniqueName='date' label={`${FnConvertDateToUtcOrUtcToDate(item.LastUpdated, false, true)}`} />
										</div>
										<div className='nz-note-user'>
											<Label uniqueName='user' label={`${item.UserName}`} />
										</div>
									</div>
									{!selectedItem || selectedItem !== item ? <div className='nz-info-div'>
										{
											item.NotesType?.toLowerCase() === "image" || item.NotesType?.toLowerCase() === "audio" || item.NotesType?.toLowerCase() === "video" ?
												<ActionImage image={{
													uniqueName: `info-icon`,
													source: handleSvgFileName(item).icon,
													w: 'var(--image-size-2)',
													type: "svg",
													tooltip: handleSvgFileTooltip(item)
												}} w={'var(--node_height)'} h={'var(--node_height)'}
													uniqueName={`deleteicon`}
													actionCode={'info-icon'}
													disabled={false}
													handleMouse={() => handleAIClick(item, handleSvgFileName(item).iconName)} /> :
												<div className='nz-info-image'> <Image
													uniqueName={'info'}
													source={handleSvgFileName(item).icon}
													w={'var(--image-size-2)'}
													tooltip={handleSvgFileTooltip(item)}
												/></div>
										}
										<div className='nz-nodes-text'>

											{item.FileUID && item.NotesType?.toLowerCase() === "image" ? <div className='nz-downlaod-file-name'><Label uniqueName='notes' label={item.fileObj && item.fileObj?.fileName as string} /> </div> : ""}
											{item.NotesMAX.length >= 64 ?
												<div className='nz-notes-text-like-link' onClick={() => {
													setShowMessage(true)
													setSelectedItem(item)
												}}>
													<Label uniqueName='notes' label={item.NotesMAX} />
												</div>
												: <Label uniqueName='notes' label={item.NotesMAX} />}
										</div>
									</div >
										:
										<>
											{selectedItem && showMessage && item.NotesType?.toLowerCase() === "message" && <InfoMessage message={selectedItem.NotesMAX} handleClose={() => setSelectedItem(null)} />}
											{selectedItem && !showMessage && item.NotesType?.toLowerCase() === "video" && selectedNoteProps && <Video handleClose={() => setSelectedItem(null)} noteProps={selectedNoteProps} sendNotes={handleUpdateData} />}
											{selectedItem && !showMessage && item.NotesType?.toLowerCase() === "audio" && selectedNoteProps && <Audio handleClose={() => setSelectedItem(null)}
												noteProps={selectedNoteProps} />}
										</>}

								</div >
							)
						})}
					</div >
					<div className='nz-notes-container'>
						{!selectedItem && noteDetails && <Notes {...noteDetails} sendTooltip={"Send Note"}
							allowVideo={!isDisableAvNotes}
							allowAudio={!isDisableAvNotes}
							handleDelete={handleDeleteNotes} />}
					</div>
				</div >
			</div >
			<YesNoFormContainer
				isOpen={deleteOpen}
				uniqueName={props.uniqueName}
				message={confirmMessage}
				showOkButton={showOkButton}
				handleYesButtonClick={handleConfirmYesClick}
				handleNoButtonClick={() => {
					setDeleteOpen(false);
				}}
				handleOkButtonClick={() => {
					setDeleteOpen(false);
				}}
			/>
		</div >

	)
}

export { FqaNotes }