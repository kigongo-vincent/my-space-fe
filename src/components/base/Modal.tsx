import React, { AudioHTMLAttributes, DetailedHTMLProps, HTMLAttributes, Ref, useEffect, useRef, useState } from 'react'
import View from './View'
import Text from './Text'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'

// test 
import TestAudio from "../../assets/test/audio.mp3"

const Modal = () => {

    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)

    const handlePlay = () => {
        if (playing) {
            audioRef.current?.pause()

            setPlaying(false)

            console.log(audioRef.current)
        } else {
            audioRef.current?.play()
            setPlaying(true)
        }
    }

    if (audioRef?.current) {
        audioRef.current.onprogress = (e => {
            console.log(e.timeStamp)
        })
    }


    return (
        <View className='fixed top-0 left-0 z-50 h-screen flex items-stretch w-screen bg-black/40' style={{ backdropFilter: 'blur(2px)' }}>

            <View className=' w-[40%] flex-col gap-3 flex items-center justify-center'>

                <img src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg" className='rounded-full h-[20vh] object-cover w-[20vh]' alt="" />
                <Text size='md' className='text-white' value={"pop music album 2023.mp3"} />

                {/* range  */}
                <View className='flex items-center w-[75%] gap-2'>
                    <Text value={"1:00"} className='text-white' />
                    <View className='bg-white/30 rounded-full h-1 w-full'>
                        <View className='bg-white rounded-full h-full w-[30%]' />
                    </View>
                    <Text value={"2:30"} className='text-white' />
                </View>

                {/* audio  */}
                <audio src={TestAudio} ref={audioRef}></audio>

                {/* controls  */}
                <View className='flex text-white items-center gap-4 justify-center'>
                    <SkipBack size={18} />
                    <View onClick={handlePlay}>
                        {
                            !playing
                                ?
                                <Play onClick={handlePlay} className='bg-white p-4 rounded-full' size={45} color='black' />
                                :
                                <Pause onClick={handlePlay} className='bg-white p-4 rounded-full' size={45} color='black' />
                        }
                    </View>
                    <SkipForward size={18} />
                </View>

            </View>

            <View mode='foreground' className='font-medium flex-1'>

            </View>

        </View>
    )
}

export default Modal