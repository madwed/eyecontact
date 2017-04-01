export default function DataSource ({
  connection,
  onOpen,
  onData,
  onClose,
  onError,
}) {
  connection.on('open', () => {
    onOpen();
    connection.on('data', onData);
  });

  connection.on('close', () => {
    connection.close();
    onClose();
  });

  connection.on('error', onError);
  window.onbeforeunload = () => connection.close();

  this.connection = connection;
}
