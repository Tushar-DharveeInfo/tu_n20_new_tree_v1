import { useRef, useState } from 'react'
import { getFirebaseToken, getRuntimeConfig } from '@n20a/libauth'
import {
    DEFAULT_MAX_AUDIO_RECORDING_TIME,
    DEFAULT_MAX_VIDEO_RECORDING_TIME,
    Notes,
} from '@n20a/libavnotes'
import type { INote } from '@n20a/libavnotes'
import '@n20a/libavnotes/style.css'
import { useMainAppContext } from '../../../../../shared/context/hooks/MainAppHooks'
import { useStatusBarContext } from '../../../../../shared/context/hooks/StatusBarHooks'
import { YesNoFormContainer } from '../../../../../shared/basic/yesnoformcontainer/YesNoFormContainer'
import { FnGenerateUID } from '../../../../../shared/allcommon/settingsform/FnGenerateUID'

interface IRequestSupport {
    uniqueName: string;
    featureId: string;
}

// Convert Blob / File to a pure base64 string
const fileToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = (reader.result as string) || ''
            const base64 = result.includes(',') ? result.split(',')[1] : result
            resolve(base64)
        }
        reader.onerror = error => reject(error)
        reader.readAsDataURL(blob)
    })
}

// Match the service portal's {bid}-{cid}-{yymmddhhmmss}-{filename} format.
const generateFileName = (bid: string, cid: string, originalName: string) => {
    const now = new Date()
    const pad = (value: number) => String(value).padStart(2, '0')
    const timestamp = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const baseName = originalName.trim().split(/[\\/]/).pop() || ''
    if (!baseName) return ''
    const cleanName = baseName.replace(/^[^-]+-[^-]+-\d{12}[-_]?(.*)$/, '$1') || baseName
    return `${bid}-${cid}-${timestamp}-${cleanName}`
}

const RequestSupportForm = ({ uniqueName }: IRequestSupport) => {
    const mainAppContext = useMainAppContext()
    const statusBarContext = useStatusBarContext()
    const submittingRef = useRef(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')
    const [editorVersion, setEditorVersion] = useState(0)
    const [noteDetails, setNoteDetails] = useState<INote>(() => ({
        noteId: `${uniqueName}-notes`,
        noteTitle: '',
        notecontent: '',
        noteCreatedAt: new Date(),
        maxAudioRecordingTime: DEFAULT_MAX_AUDIO_RECORDING_TIME,
        maxVideoRecordingTime: DEFAULT_MAX_VIDEO_RECORDING_TIME,
    }))

    const handleSendTicketNote = async (note: INote) => {
        if (submittingRef.current) return
        // Notes clears itself after invoking sendNote without awaiting the result.
        // Remount with the submitted draft so failures leave it available to retry.
        setNoteDetails(note)
        setEditorVersion(previous => previous + 1)
        const text = note.notecontent?.trim() ?? ''
        const bid = String(mainAppContext.userAuthSession?.bid ?? '').trim()
        const cid = String(mainAppContext.userAuthSession?.cid ?? '').trim()

        if (!text) {
            setMessage('Please enter a description for the support request before saving.')
            return
        }
        if (!bid || !cid) {
            setMessage('Your business or contact session is not available. Please sign in again.')
            return
        }

        const cloudrunUrl = (
            (window as any)?.APP_CONFIG?.CLOUDRUN_URL ||
            (window as any)?.appSettings?.CLOUDRUN_URL ||
            import.meta.env.VITE_CLOUDRUN_URL ||
            getRuntimeConfig()?.CLOUDRUN_URL
        )?.trim()

        if (!cloudrunUrl) {
            setMessage('Cloud Run API URL is not configured. Please contact support.')
            return
        }

        const validationCode = FnGenerateUID();

        let uploadedFileName = ''
        let targetFilenamePath = ''
        let content = ''
        let contentType = ''

        if (note.notefile) {
            const originalName = note.notefileName || (note.notefile instanceof File ? note.notefile.name : '')
            if (!originalName) {
                setMessage('Attachment file name is missing. Please re-attach the file.')
                return
            }
            uploadedFileName = generateFileName(bid, cid, originalName)
            if (!uploadedFileName) {
                setMessage('Unable to generate attachment file name.')
                return
            }
            const fileContentType = note.notefile.type || ''
            if (!fileContentType) {
                setMessage('Attachment file type is missing or not supported.')
                return
            }
            contentType = fileContentType
            targetFilenamePath = `n20-bucket-01/sm/smfiles/tickets/${uploadedFileName}`
            try {
                content = await fileToBase64(note.notefile)
            } catch {
                setMessage('Unable to read attachment file content. Please try again.')
                return
            }
            if (!content) {
                setMessage('Attachment file content is empty.')
                return
            }
        }

        submittingRef.current = true
        setSubmitting(true)
        statusBarContext.setIsLoading(true)
        statusBarContext.setLoadingLabel(note.notefile ? 'Uploading attachment and creating ticket...' : 'Creating support ticket...')
        try {
            const token = await getFirebaseToken().catch(() => null)
            if (!token) {
                throw new Error('Your authentication session has expired. Please sign in again.')
            }

            const now = new Date().toISOString()
            const ticketid = `ticket_${Date.now()}`
            const ticket = {
                bid,
                cid,
                ticketid,
                tickettype: 'Support Request',
                subscription: '',
                mfg: '',
                eqtype: '',
                prodno: uploadedFileName,
                moreinfo: text,
                status: 'Pending',
                daterequested: now,
                datereleased: '',
                lastupdated: now,
                monitorupdated: now,
                monitor: false,
            }

            const endpoint = `${cloudrunUrl.replace(/\/+$/, '')}/api/notes/add`
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }

            const requestBody = {
                validationCode,
                pathSegments: ['businesses', bid, 'tickets'],
                docId: ticketid,
                doc: JSON.stringify(ticket),
                targetFilenamePath,
                content,
                contentType,
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                const errorText = await response.text().catch(() => '')
                let errorMessage = `Unable to submit the support request (HTTP ${response.status}).`
                try {
                    const parsed = JSON.parse(errorText)
                    errorMessage = parsed?.error || parsed?.message || errorMessage
                } catch {
                    if (errorText) errorMessage = errorText
                }
                throw new Error(errorMessage)
            }

            const responseData = await response.json().catch(() => ({}))
            if (responseData && responseData.success === false) {
                throw new Error(responseData?.error || responseData?.message || 'Unable to submit the support request. Please try again.')
            }

            setNoteDetails(previous => ({
                ...previous,
                notecontent: '',
                notefile: undefined,
                notefileName: undefined,
                noteCreatedAt: new Date(),
            }))
            setEditorVersion(previous => previous + 1)
            setMessage('Your support request has been submitted successfully.')
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Unable to submit the support request. Please try again.')
        } finally {
            submittingRef.current = false
            setSubmitting(false)
            statusBarContext.setIsLoading(false)
            statusBarContext.setLoadingLabel(undefined)
        }
    }

    return (
        <div className='nz-w-100 nz-h-100 nz-d-flex-column nz-settings-right-container-form'>
            <div
                className='nz-w-100 nz-h-100'
                style={{ flex: '1 1 0', minHeight: 0 }}
                aria-busy={submitting}
                inert={submitting}
            >
                <Notes
                    {...noteDetails}
                    key={editorVersion}
                    allowAudio={false}
                    allowVideo={false}
                    placeholderMessage='Type your support request here...'
                    sendTooltip='Send support request'
                    sendNote={handleSendTicketNote}
                />
            </div>
            <YesNoFormContainer
                isOpen={Boolean(message)}
                uniqueName={`${uniqueName}-message`}
                message={message}
                showOkButton={true}
                handleOkButtonClick={() => setMessage('')}
            />
        </div>
    )
}

export const RequestSupport = (props: IRequestSupport) => (
    <RequestSupportForm {...props} />
)
