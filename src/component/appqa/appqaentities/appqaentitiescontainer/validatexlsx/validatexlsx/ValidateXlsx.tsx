
import { useEffect, useState } from 'react';
import { XlsxValidation } from '@n20a/libform';
import '@n20a/libform/style.css'
import { IValidateXlsx } from '../../../../allinterface/iappqaentitiescontainer/validatexlsx/IValidateXlsx';
import '../../../../allcss/appqaentitiescontainer/validatexlsx/ValidateXlsx.css'

const ValidateXlsx = (_xlsxProps: IValidateXlsx) => {
    const { uniqueName, handleShowUserMessage } = _xlsxProps;
    const [loading, setLoading] = useState<boolean>(true);
    const [xlsxSchemaJson, setValidateXlsxSchemaJson] = useState<unknown[] | null>(null);
    const [xlsxSchemaLoadError, setValidateXlsxSchemaLoadError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadValidateXlsxSchema = async () => {
            try {
                const response = await fetch('/privateschema/xlsxschema.json');

                if (!response.ok) {
                    throw new Error(`Failed to load xlsxschema.json (${response.status})`);
                }

                const parsed = await response.json();

                if (!Array.isArray(parsed)) {
                    throw new Error('xlsxschema.json must contain an array.');
                }

                if (!cancelled) {
                    setValidateXlsxSchemaJson(parsed);
                    setValidateXlsxSchemaLoadError(null);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);

                if (!cancelled) {
                    setValidateXlsxSchemaJson(null);
                    setValidateXlsxSchemaLoadError(message);
                }
            }
            finally {
                setLoading(false);
            }
        };

        loadValidateXlsxSchema();

        return () => {
            cancelled = true;
        };
    }, []);


    useEffect(() => {
        if (xlsxSchemaLoadError && handleShowUserMessage) {
            handleShowUserMessage(xlsxSchemaLoadError);
        }
    }, [xlsxSchemaLoadError]);

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading...</div>;
    }

    return (
        <div
            key={uniqueName}
            className='nz-wh-100 nz-d-flex-hv-center nz-overflow-hidden nz-xlsx-container'
        >
            <XlsxValidation key={`xlsx-data-${xlsxSchemaJson?.length ?? 0}`} schemaJson={xlsxSchemaJson} schemaLoadError={xlsxSchemaLoadError} />
        </div>
    );
}

export default ValidateXlsx
