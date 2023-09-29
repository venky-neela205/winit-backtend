const express = require("express")
const { open } = require("sqlite")
const sqlite3 = require("sqlite3")
const cors = require("cors")
const path = require("path")

const dbPath = path.join(__dirname, "routesApp.db")

const app = express()

app.use(cors())
app.use(express.json())

let db = null

const InitializeDbAndServer = async () => {
    try{
        db = await open({
            filename : dbPath,
            driver : sqlite3.Database,
        });

        app.listen(3001, () => 
            console.log("server running at http://localhost:3001/")
        )
    }catch(error){
        console.log(`DB error : ${error.message}`);
        process.exit(1);
    }
};

InitializeDbAndServer()

app.get('/selectedCustomers/:routeCode', async (request, response) => {
    const { routeCode } = request.params;
  
    const getSelectedCustomerDataQuery = `
      SELECT *
      FROM RouteStore
      WHERE RouteCode = '${routeCode}'`;
  
    const getSelectedCustomerCountQuery = `
      SELECT COUNT(*) AS customerCount
      FROM RouteStore
      WHERE RouteCode = '${routeCode}'`;
  
    try {
      const [dataResult, countResult] = await Promise.all([
        db.all(getSelectedCustomerDataQuery),
        db.get(getSelectedCustomerCountQuery),
      ]);
  
      if (countResult && countResult.customerCount !== undefined) {
        const customerData = dataResult || [];
        const customerCount = countResult.customerCount;
        response.json({ data: customerData, count: customerCount });
      } else {
        response.status(404).json({ error: 'Route code not found' });
      }
    } catch (error) {
      console.error(error);
      response.status(500).send('Internal Server Error');
    }
  });
  

app.post('/selectedCustomers', async (request, response) => {
    const { routecode, selectedCustomers } = request.body; // Correct the property name to "routecode"
    
    for (const customer of selectedCustomers) {
        const { customerCode, customerName, customerAddress } = customer;
        
        const insertSelectedCustomerListQuery = `
            INSERT INTO RouteStore (Code, Name, Address, RouteCode)
            VALUES (
                '${customerCode}',
                '${customerName}',
                '${customerAddress}',
                '${routecode}'
            );`;

        try {
            await db.run(insertSelectedCustomerListQuery);
        } catch (error) {
            console.error(error);
            response.status(500).send('Internal Server Error');
            return; // Return to avoid sending a response in case of an error
        }
    }
    
    response.json({ message: 'Customers Stored Successfully' });
});

app.post('/schedule', async (request, response) => {
    const { code, isActiveSun, isActiveMon, isActiveTue, isActiveWed, isActiveThu, isActiveFri, isActiveSat } = request.body;

    const insertScheduleQuery = `
        INSERT INTO RoutePlanSchedule (RouteId, Sun, Mon, Tue, Wed, Thu, Fri, Sat)
        VALUES (
            '${code}',
            ${isActiveSun},
            ${isActiveMon},
            ${isActiveTue},
            ${isActiveWed},
            ${isActiveThu},
            ${isActiveFri},
            ${isActiveSat}
        );`;

    try {
        await db.run(insertScheduleQuery);
        response.json({ message: 'Schedule Stored Successfully' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Internal Server Error' }); // Send a JSON error response
    }
});

app.get('/warehouse', async (request, response) => {
    const getWarehouseListQuery = `
        SELECT
          Code,
          Name
        From 
          warehouse;`;
    
          try {
            const warehouseList = await db.all(getWarehouseListQuery);
            response.send(warehouseList);
        } catch (error) {
            console.error(error);
            response.status(500).send('Internal Server Error');
        }
})

app.get('/user', async (request, response) => {
    const getUserListQuery = `
        SELECT
          Code,
          Name
        From 
          user;`;
    
          try {
            const userList = await db.all(getUserListQuery);
            response.send(userList);
        } catch (error) {
            console.error(error);
            response.status(500).send('Internal Server Error');
        }
})

app.get('/store', async (request, response) => {
    const getStoreListQuery = `
        SELECT
          *
        From 
          store;`;
    
          try {
            const storeList = await db.all(getStoreListQuery);
            response.send(storeList);
        } catch (error) {
            console.error(error);
            response.status(500).send('Internal Server Error');
        }
})

app.post('/routeList', async (request, response) => {
    const { code, name, fromDate, toDate, isActive, userId,warehouseId } = request.body;

    const insertRouteQuery = `
        INSERT INTO route (Code, Name, FromDate, ToDate, IsActive, UserId, WarehouseId)
        VALUES (
            '${code}',
            '${name}',
            '${fromDate}',
            '${toDate}',
            ${isActive},
            '${userId}',
            '${warehouseId}'
        );`;

    try {
        const routeList = await db.run(insertRouteQuery);
        response.json({ message: 'Route Stored Successfully' }); // Send a JSON response
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Internal Server Error' }); // Send a JSON error response
    }
});

app.put('/routeList/:routeId', async (request, response) => {
    const routeId = request.params.routeId;
    const { code, name, fromDate, toDate, isActive, userId, warehouseId } = request.body;
    const updateRouteQuery = `
        UPDATE route
        SET
            Code = '${code}',
            Name = '${name}',
            FromDate = '${fromDate}',
            ToDate = '${toDate}',
            IsActive = ${isActive},
            UserId = '${userId}',
            WarehouseId = '${warehouseId}'
        WHERE
            Id = ${routeId};`;

    try {
        const routeUpdate = await db.run(updateRouteQuery);
        if (routeUpdate.changes > 0) {
            response.json({ message: 'Route Updated Successfully' });
        } else {
            response.status(404).json({ error: 'Route not found' });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/mainRouteList', async (request, response) => {
    const getMainRouteListQuery = `
        SELECT
          *
        From 
          route;`;
          try {
            const mainRouteList = await db.all(getMainRouteListQuery);
            response.send(mainRouteList);
        } catch (error) {
            console.error(error);
            response.status(500).send('Internal Server Error');
        }
})

// app.post('/routeCustomerList', async (request, response) => {
//     const { routeId, customerIds } = request.body;

//     try {
//         // Delete existing associations for the given route
//         await db.run(`DELETE FROM route_customer WHERE RouteId = ${routeId}`);

//         // Insert new associations
//         for (const customerId of customerIds) {
//             await db.run(`INSERT INTO route_customer (RouteId, CustomerId) VALUES (${routeId}, ${customerId})`);
//         }

//         response.json({ message: 'Customers Associated with Route Successfully' });
//     } catch (error) {
//         console.error(error);
//         response.status(500).json({ error: 'Internal Server Error' });
//     }
// });


