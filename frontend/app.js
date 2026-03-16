const API="http://127.0.0.1:8000/api"

async function classifyTicket(){

    const description=document.getElementById("description").value

    if(!description) return

    const res=await fetch(`${API}/tickets/classify/`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            description:description
        })
    })

    const data=await res.json()

    if(data.suggested_category){
        document.getElementById("category").value=data.suggested_category
    }

    if(data.suggested_priority){
        document.getElementById("priority").value=data.suggested_priority
    }

}


async function submitTicket(){

    const title=document.getElementById("title").value
    const description=document.getElementById("description").value
    const category=document.getElementById("category").value
    const priority=document.getElementById("priority").value

    await fetch(`${API}/tickets/`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            title:title,
            description:description,
            category:category,
            priority:priority
        })
    })

    document.getElementById("title").value=""
    document.getElementById("description").value=""

    loadTickets()
    loadStats()

}


async function loadTickets(){

    let url=`${API}/tickets/?`

    const category=document.getElementById("filterCategory").value
    const priority=document.getElementById("filterPriority").value
    const status=document.getElementById("filterStatus").value

    if(category) url+=`category=${category}&`
    if(priority) url+=`priority=${priority}&`
    if(status) url+=`status=${status}&`

    const res=await fetch(url)

    const tickets=await res.json()

    const container=document.getElementById("tickets")

    container.innerHTML=""

    tickets.forEach(ticket=>{

        const div=document.createElement("div")

        div.className="ticket"

        div.innerHTML=`
            <h3>${ticket.title}</h3>
            <p>${ticket.description}</p>
            <p><b>Category:</b> ${ticket.category}</p>
            <p><b>Priority:</b> ${ticket.priority}</p>

            <select onchange="updateStatus(${ticket.id},this.value)">
                <option value="open" ${ticket.status=="open"?"selected":""}>Open</option>
                <option value="in_progress" ${ticket.status=="in_progress"?"selected":""}>In Progress</option>
                <option value="resolved" ${ticket.status=="resolved"?"selected":""}>Resolved</option>
                <option value="closed" ${ticket.status=="closed"?"selected":""}>Closed</option>
            </select>

            <hr>
        `

        container.appendChild(div)

    })

}


async function updateStatus(id,status){

    await fetch(`${API}/tickets/${id}/`,{
        method:"PATCH",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            status:status
        })
    })

    loadTickets()
    loadStats()

}


async function loadStats(){

    const res=await fetch(`${API}/tickets/stats/`)

    const stats=await res.json()

    const div=document.getElementById("stats")

    div.innerHTML=`
        <p><b>Total Tickets:</b> ${stats.total_tickets}</p>
        <p><b>Open Tickets:</b> ${stats.open_tickets}</p>
        <p><b>Avg Tickets Per Day:</b> ${stats.avg_tickets_per_day}</p>
        <p><b>Priority Breakdown:</b> ${JSON.stringify(stats.priority_breakdown)}</p>
        <p><b>Category Breakdown:</b> ${JSON.stringify(stats.category_breakdown)}</p>
    `

}


loadTickets()
loadStats()