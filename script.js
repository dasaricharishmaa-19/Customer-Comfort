const messageInput = document.getElementById("message");
const analyzeButton = document.getElementById("analyzeBtn");

const resultBox = document.getElementById("resultBox");
const errorBox = document.getElementById("errorBox");

const emotionValue = document.getElementById("emotionValue");
const intensityValue = document.getElementById("intensityValue");
const priorityValue = document.getElementById("priorityValue");
const departmentValue = document.getElementById("departmentValue");

const moodValue = document.getElementById("moodValue");
const frustratedValue = document.getElementById("frustratedValue");
const urgentValue = document.getElementById("urgentValue");
const escalationValue = document.getElementById("escalationValue");

const reasonValue = document.getElementById("reasonValue");
const responseValue = document.getElementById("responseValue");

const ticketDepartment = document.getElementById("ticketDepartment");
const ticketPriority = document.getElementById("ticketPriority");

const copyBtn = document.getElementById("copyBtn");


analyzeButton.addEventListener("click", analyzeEmotion);


async function analyzeEmotion() {

    const text = messageInput.value.trim();

    errorBox.style.display = "none";
    resultBox.style.display = "none";


    if (!text) {

        showError("Please enter a customer message.");

        return;
    }


    analyzeButton.disabled = true;
    analyzeButton.innerHTML = "⏳ Analyzing Customer Message...";


    try {

        const response = await fetch(
            "http://127.0.0.1:8000/analyze",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text: text
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail || "AI analysis failed."
            );
        }


        console.log("AI RESPONSE:", data);


        const analysis = data.analysis;


        // Extract AI fields

        const emotion = extractField(
            analysis,
            "Emotion"
        );

        const intensity = extractField(
            analysis,
            "Intensity"
        );

        const mood = extractField(
            analysis,
            "Mood"
        );

        const frustrated = extractField(
            analysis,
            "Frustrated"
        );

        const urgent = extractField(
            analysis,
            "Urgent"
        );

        const reason = extractField(
            analysis,
            "Reason"
        );

        const recommendedResponse = extractField(
            analysis,
            "Recommended Response"
        );


        // Smart priority

        const priority = calculatePriority(
            intensity,
            urgent,
            frustrated
        );


        // Department routing

        const department = detectDepartment(text);


        // Escalation

        const escalation =
            priority === "CRITICAL" ||
            priority === "HIGH";


        // Display results

        emotionValue.textContent =
            emotion || "Unknown";

        intensityValue.textContent =
            intensity || "Unknown";

        priorityValue.textContent =
            priority;

        departmentValue.textContent =
            department;

        moodValue.textContent =
            mood || "Unknown";

        frustratedValue.textContent =
            frustrated || "No";

        urgentValue.textContent =
            urgent || "No";

        escalationValue.textContent =
            escalation ? "Required" : "Not Required";

        reasonValue.textContent =
            reason || "No reason provided.";

        responseValue.textContent =
            recommendedResponse ||
            "No recommendation generated.";

        ticketDepartment.textContent =
            department;

        ticketPriority.textContent =
            priority;


        resultBox.style.display = "block";


        // Scroll to results

        resultBox.scrollIntoView({
            behavior: "smooth"
        });

    }

    catch (error) {

        console.error(error);

        showError(error.message);

    }

    finally {

        analyzeButton.disabled = false;

        analyzeButton.innerHTML =
            "✨ Analyze Customer Emotion";
    }
}


/* -----------------------------
   Extract AI response fields
----------------------------- */

function extractField(text, field) {

    const regex = new RegExp(
        field + "\\s*:\\s*(.*)",
        "i"
    );

    const match = text.match(regex);

    if (!match) {
        return "";
    }

    return match[1].trim();
}


/* -----------------------------
   Priority Calculation
----------------------------- */

function calculatePriority(
    intensity,
    urgent,
    frustrated
) {

    const numberMatch =
        intensity.match(/\d+/);

    const score =
        numberMatch
            ? parseInt(numberMatch[0])
            : 5;


    if (
        score >= 9 ||
        urgent.toLowerCase().includes("yes")
    ) {

        return "CRITICAL";
    }


    if (
        score >= 7 ||
        frustrated.toLowerCase().includes("yes")
    ) {

        return "HIGH";
    }


    if (score >= 4) {

        return "MEDIUM";
    }


    return "LOW";
}


/* -----------------------------
   Smart Department Routing
----------------------------- */

function detectDepartment(text) {

    const message =
        text.toLowerCase();


    if (
        message.includes("order") ||
        message.includes("delivery") ||
        message.includes("deliver") ||
        message.includes("shipping") ||
        message.includes("shipment") ||
        message.includes("late") ||
        message.includes("delayed")
    ) {

        return "Order & Delivery";
    }


    if (
        message.includes("payment") ||
        message.includes("refund") ||
        message.includes("money") ||
        message.includes("charged") ||
        message.includes("billing")
    ) {

        return "Billing & Payments";
    }


    if (
        message.includes("broken") ||
        message.includes("not working") ||
        message.includes("error") ||
        message.includes("technical") ||
        message.includes("login")
    ) {

        return "Technical Support";
    }


    if (
        message.includes("return") ||
        message.includes("replace") ||
        message.includes("damaged")
    ) {

        return "Returns & Replacement";
    }


    return "General Customer Support";
}


/* -----------------------------
   Error
----------------------------- */

function showError(message) {

    errorBox.textContent =
        "❌ " + message;

    errorBox.style.display =
        "block";
}


/* -----------------------------
   Copy AI response
----------------------------- */

copyBtn.addEventListener(
    "click",
    async function () {

        const response =
            responseValue.textContent;


        try {

            await navigator.clipboard.writeText(
                response
            );

            copyBtn.textContent =
                "✅ Copied!";

            setTimeout(() => {

                copyBtn.textContent =
                    "📋 Copy Response";

            }, 2000);

        }

        catch (error) {

            console.error(error);
        }
    }
);