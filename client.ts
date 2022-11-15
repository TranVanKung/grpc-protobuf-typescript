import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ProtoGrpcType } from "./proto/random";

const PORT = 8082;
const PROTO_FILE = "./proto/random.proto";

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
const grpcObj = grpc.loadPackageDefinition(
  packageDef
) as unknown as ProtoGrpcType;

const client = new grpcObj.randomPackage.Random(
  `0.0.0.0:${PORT}`,
  grpc.credentials.createInsecure()
);

const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);
client.waitForReady(deadline, (err) => {
  if (err) {
    console.log(err);
    return;
  }

  onClientReady();
});

function onClientReady() {
  client.PingPong({ message: "Ping" }, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log("result", result);
  });

  const streamRandomNumber = () => {
    const stream = client.randomNNumbers({ maxVal: 100 });
    stream.on("data", (chunk) => {
      console.log("chunk", chunk);
    });

    stream.on("end", () => {
      console.log("communication ended");
    });
  };
  streamRandomNumber();

  const streamTodoList = () => {
    const stream = client.TodoList((err, result) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log("result", result);
    });

    stream.write({ todo: "Todo 1 ", status: "Never" });
    stream.write({ todo: "Todo 2", status: "Doing" });
    stream.write({ todo: "Todo 3", status: "Impossible" });
  };
  streamTodoList();
}
