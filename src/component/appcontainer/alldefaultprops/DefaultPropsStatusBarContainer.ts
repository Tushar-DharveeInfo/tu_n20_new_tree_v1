
const WhatToShowInStatusBar = {
    site: ["Site|Name", "Rooms", "Racks", "PDUs"],
    room: ["Site", "Room|Name", "Floors", "Racks", "PDUs"],
    floor: ["Site", "Room", "Floor|Name", "Racks", "PDUs", "Devices"],
    location: ["Site", "Room", "Floor", "Racks", "PDUs", "Devices"],
    rack: ["Site", "Room", "Floor", "Devices", "PDUs"],
    device: ["Site", "Room", "Floor", "Device|Name"],
    Reminder: ["User|LoginUserName"],
    Tasks: ["User|LoginUserName"],
    User: ["User|LoginUserName"],
}

export { WhatToShowInStatusBar }