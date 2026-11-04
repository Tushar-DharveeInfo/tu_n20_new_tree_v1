
import { useEffect, useState } from 'react'
import { IBackgroundTasksContainer } from '../../allinterface/IAppqaTask'
import { BackgroundTasks } from '../backgroundtasks/BackgroundTasks'

const BackgroundTasksContainer = (backgroundTaskContainerProps: IBackgroundTasksContainer) => {
    const [key, setKey] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setKey(prev => prev + 1)
        }, backgroundTaskContainerProps.interval)

        return () => clearInterval(interval)
    }, [backgroundTaskContainerProps.interval])

    return <BackgroundTasks key={key} {...backgroundTaskContainerProps} />
}

export { BackgroundTasksContainer }