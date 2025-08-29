import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useUserAuth } from '../context/userAuthContext'; 
const Instructions: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useUserAuth();
    console.log("user",user) 
    // const [isProcessing, setIsProcessing] = useState<boolean>(false);

    // useEffect(() => {
    //     if (!isLoading && !user) {
    //         navigate('/login');
    //     }
    // }, [isLoading, user, navigate]);


    const startQuiz = async () => {
        // if (!user) {
        //     console.error('User is not authenticated');
        //     return;
        // }

        // setIsProcessing(true);  
        
        // try {
          
        //     const response = await fetch('/api/start-quiz', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //             userId: user._id,
        //             durationMinutes: user.quizDuration, 
        //         }),
        //     });

        //     if (!response.ok) {
        //         throw new Error('Failed to start the quiz');
        //     }

        //     const data = await response.json();
        //     console.log('Quiz started successfully', data); 

            navigate('/');
        // } catch (error) {
        //     console.error('Error starting quiz:', error);
        // } finally {
        //     setIsProcessing(false); 
        // }
    };


    if (isLoading) {
        return <div>Loading...</div>; 
    }

    return (
        <div>
            <h2>Instructions</h2>
            <p>Here are the instructions for the quiz. Make sure you read them carefully.</p>
            <button 
                onClick={startQuiz} 
                // disabled={isProcessing}
            >
                {/* {isProcessing ? 'Starting Quiz...' : 'Start Quiz'}
                 */}
                 start quiz
            </button>
        </div>
    );
};

export default Instructions;
